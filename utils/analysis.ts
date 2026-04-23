// ─── Subgraph query ───────────────────────────────────────────────────────────

export const HISTORIES_QUERY = `{
  docHistories(orderBy: date) {
    type
    docStatus
    date
    document {
      id
    }
  }
  sectionHistories(orderBy: date) {
    date
    sectionStatus
    type
    section {
      doc {
        id
      }
      id
      divisionLeader {
        firstName
        lastName
        dcategory
      }
    }
  }
  clauseHistories(orderBy: date) {
    type
    date
    clauseStatus
    clause {
      id
      section {
        id
      }
      divisionMember {
        firstName
        lastName
      }
    }
  }
}`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocHistory {
  type: number;
  docStatus: number;
  date: string;
  document: { id: string };
}

export interface SectionHistory {
  date: string;
  sectionStatus: number;
  type: number;
  section: {
    id: string;
    doc: { id: string };
    divisionLeader: {
      firstName: string;
      lastName: string;
      dcategory: number;
    } | null;
  };
}

export interface ClauseHistory {
  type: number;
  date: string;
  clauseStatus: number;
  clause: {
    id: string;
    section: { id: string };
    divisionMember: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

export interface SubgraphData {
  docHistories: DocHistory[];
  sectionHistories: SectionHistory[];
  clauseHistories: ClauseHistory[];
}

// ─── Division mapping ─────────────────────────────────────────────────────────

const DIVISION_MAP: Record<number, string> = {
  0: 'NoDivision',
  1: 'Legal',
  2: 'ProjectManagement',
  3: 'Preconstruction',
  4: 'Estimating',
  5: 'Finance',
  6: 'Accounting',
  7: 'RiskManagement',
  8: 'Insurance',
  9: 'Safety',
};

function toDiv(dcategory: number): string {
  return DIVISION_MAP[dcategory] ?? 'NoDivision';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// Group an array by a key function
function groupBy<T>(arr: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}

// Pick the bottleneck stage (highest non-null duration)
function pickBottleneck(stages: { stage: string; duration: number | null }[]) {
  return (
    stages
      .filter((s) => s.duration !== null)
      .sort((a, b) => b.duration! - a.duration!)[0] ?? {
      stage: stages[0]?.stage ?? 'unknown',
      duration: null,
    }
  );
}

// ─── Document analysis ────────────────────────────────────────────────────────

function analyzeDocument(events: DocHistory[]) {
  const sorted = [...events].sort((a, b) => parseInt(a.date) - parseInt(b.date));

  // Completion: first event where docStatus === 4
  const esignEvent = sorted.find((e) => e.docStatus === 4);
  const isCompleted = !!esignEvent;

  // Cycle time: first event → first docStatus=4 event
  let cycleTime: number | null = null;
  if (isCompleted && sorted.length >= 2) {
    cycleTime = parseInt(esignEvent!.date) - parseInt(sorted[0].date);
  }

  // Trim to events up to and including first docStatus=4
  const trimmed = esignEvent
    ? sorted.slice(0, sorted.indexOf(esignEvent) + 1)
    : sorted;

  const firstEventTime = parseInt(trimmed[0].date);

  // Stage 1: pending_to_request — first event → first type=1
  const requestEvent = trimmed.find((e) => e.type === 1);
  const pendingToRequest =
    requestEvent && parseInt(requestEvent.date) > firstEventTime
      ? parseInt(requestEvent.date) - firstEventTime
      : null;

  // Stage 2: request_to_approved — first type=1 → last type=2
  const firstRequest = trimmed.find((e) => e.type === 1);
  const lastApprove = [...trimmed].reverse().find((e) => e.type === 2);
  const requestToApproved =
    firstRequest && lastApprove && parseInt(lastApprove.date) > parseInt(firstRequest.date)
      ? parseInt(lastApprove.date) - parseInt(firstRequest.date)
      : null;

  // Stage 3: approved_to_esigned — last type=2 → first type=4 or type=5 after it
  let approvedToEsigned: number | null = null;
  if (lastApprove) {
    const approvedTime = parseInt(lastApprove.date);
    const esignAfterApprove = trimmed.find(
      (e) => (e.type === 4 || e.type === 5) && parseInt(e.date) > approvedTime,
    );
    if (esignAfterApprove) {
      approvedToEsigned = parseInt(esignAfterApprove.date) - approvedTime;
    }
  }

  // Reject & reassign counts
  const rejectCount = trimmed.filter((e) => e.type === 3).length;

  const stages = [
    { stage: 'pending_to_request', duration: pendingToRequest },
    { stage: 'request_to_approved', duration: requestToApproved },
    { stage: 'approved_to_esigned', duration: approvedToEsigned },
  ];

  return {
    isCompleted,
    cycleTime,
    stage_durations: stages,
    bottleneck: pickBottleneck(stages),
    rejectCount,
  };
}

// ─── Section analysis ─────────────────────────────────────────────────────────

function analyzeSection(events: SectionHistory[]) {
  const sorted = [...events].sort((a, b) => parseInt(a.date) - parseInt(b.date));

  const leader = sorted[0]?.section?.divisionLeader;
  const division = leader ? toDiv(leader.dcategory) : 'NoDivision';
  const leaderName = leader ? `${leader.firstName} ${leader.lastName}` : null;

  // Stage 1: assign_to_request — first type=0 → first type=1 after it
  const assignEvent = sorted.find((e) => e.type === 0);
  const requestAfterAssign = assignEvent
    ? sorted.find((e) => e.type === 1 && parseInt(e.date) > parseInt(assignEvent.date))
    : null;
  const assignToRequest =
    assignEvent && requestAfterAssign
      ? parseInt(requestAfterAssign.date) - parseInt(assignEvent.date)
      : null;

  // Stage 2: request_to_approve — first type=1 → last type=2
  const firstRequest = sorted.find((e) => e.type === 1);
  const lastApprove = [...sorted].reverse().find((e) => e.type === 2);
  const requestToApprove =
    firstRequest && lastApprove && parseInt(lastApprove.date) > parseInt(firstRequest.date)
      ? parseInt(lastApprove.date) - parseInt(firstRequest.date)
      : null;

  // Reject & reassign counts
  const rejectCount = sorted.filter((e) => e.type === 3).length;
  const reassignCount = sorted.filter((e) => e.type === 4).length;

  const stages = [
    { stage: 'assign_to_request', duration: assignToRequest },
    { stage: 'request_to_approve', duration: requestToApprove },
  ];

  return {
    division,
    leaderName,
    stage_durations: stages,
    bottleneck: pickBottleneck(stages),
    rejectCount,
    reassignCount,
  };
}

// ─── Clause analysis ──────────────────────────────────────────────────────────

function analyzeClause(events: ClauseHistory[]) {
  const sorted = [...events].sort((a, b) => parseInt(a.date) - parseInt(b.date));

  const member = sorted[0]?.clause?.divisionMember;
  const memberName = member ? `${member.firstName} ${member.lastName}` : null;

  // Stage 1: assign_to_request — first type=0 → first type=1 after it
  const assignEvent = sorted.find((e) => e.type === 0);
  const requestAfterAssign = assignEvent
    ? sorted.find((e) => e.type === 1 && parseInt(e.date) > parseInt(assignEvent.date))
    : null;
  const assignToRequest =
    assignEvent && requestAfterAssign
      ? parseInt(requestAfterAssign.date) - parseInt(assignEvent.date)
      : null;

  // Stage 2: request_to_approve — first type=1 → last type=2
  const firstRequest = sorted.find((e) => e.type === 1);
  const lastApprove = [...sorted].reverse().find((e) => e.type === 2);
  const requestToApprove =
    firstRequest && lastApprove && parseInt(lastApprove.date) > parseInt(firstRequest.date)
      ? parseInt(lastApprove.date) - parseInt(firstRequest.date)
      : null;

  // Reject & reassign counts
  const rejectCount = sorted.filter((e) => e.type === 3).length;
  const reassignCount = sorted.filter((e) => e.type === 4).length;

  const stages = [
    { stage: 'assign_to_request', duration: assignToRequest },
    { stage: 'request_to_approve', duration: requestToApprove },
  ];

  return {
    memberName,
    stage_durations: stages,
    bottleneck: pickBottleneck(stages),
    rejectCount,
    reassignCount,
  };
}

// ─── Division rollup ──────────────────────────────────────────────────────────

interface DivisionStats {
  section_count: number;
  avg_assign_to_request: number | null;
  avg_request_to_approve: number | null;
  total_rejects: number;
  total_reassigns: number;
  bottleneck_stage: string | null;
}

function buildDivisionRollup(
  sectionResults: {
    division: string;
    stage_durations: { stage: string; duration: number | null }[];
    rejectCount: number;
    reassignCount: number;
  }[],
): Record<string, DivisionStats> {
  const divMap = new Map<
    string,
    {
      assignToRequest: number[];
      requestToApprove: number[];
      rejects: number;
      reassigns: number;
    }
  >();

  for (const s of sectionResults) {
    if (!divMap.has(s.division)) {
      divMap.set(s.division, { assignToRequest: [], requestToApprove: [], rejects: 0, reassigns: 0 });
    }
    const d = divMap.get(s.division)!;
    const a2r = s.stage_durations.find((x) => x.stage === 'assign_to_request')?.duration;
    const r2a = s.stage_durations.find((x) => x.stage === 'request_to_approve')?.duration;
    if (a2r !== null && a2r !== undefined) d.assignToRequest.push(a2r);
    if (r2a !== null && r2a !== undefined) d.requestToApprove.push(r2a);
    d.rejects += s.rejectCount;
    d.reassigns += s.reassignCount;
  }

  const result: Record<string, DivisionStats> = {};
  for (const [division, d] of divMap.entries()) {
    const avgA2R = avg(d.assignToRequest);
    const avgR2A = avg(d.requestToApprove);

    let bottleneckStage: string | null = null;
    if (avgA2R !== null && avgR2A !== null) {
      bottleneckStage = avgA2R >= avgR2A ? 'assign_to_request' : 'request_to_approve';
    } else if (avgA2R !== null) {
      bottleneckStage = 'assign_to_request';
    } else if (avgR2A !== null) {
      bottleneckStage = 'request_to_approve';
    }

    result[division] = {
      section_count: d.assignToRequest.length || d.requestToApprove.length,
      avg_assign_to_request: avgA2R,
      avg_request_to_approve: avgR2A,
      total_rejects: d.rejects,
      total_reassigns: d.reassigns,
      bottleneck_stage: bottleneckStage,
    };
  }

  return result;
}

// ─── Throughput ───────────────────────────────────────────────────────────────

function buildThroughput(
  completedDocs: { cycleTime: number | null; esignDate: number }[],
): Record<string, number> {
  // Group completed docs by ISO week (YYYY-Www)
  const weekly: Record<string, number> = {};
  for (const doc of completedDocs) {
    const date = new Date(doc.esignDate * 1000);
    const year = date.getUTCFullYear();
    // ISO week number
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const week = Math.ceil(
      ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7,
    );
    const key = `${year}-W${String(week).padStart(2, '0')}`;
    weekly[key] = (weekly[key] ?? 0) + 1;
  }
  return weekly;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function buildReport(data: SubgraphData) {
  const { docHistories, sectionHistories, clauseHistories } = data;

  const docMap = groupBy(docHistories, (e) => e.document.id);
  const sectionMap = groupBy(sectionHistories, (e) => e.section.id);
  const clauseMap = groupBy(clauseHistories ?? [], (e) => e.clause.id);

  const totalWorkflows = docMap.size;
  let completedWorkflows = 0;
  const cycleTimes: number[] = [];
  const completedDocMeta: { cycleTime: number | null; esignDate: number }[] = [];

  // Collect all section results for division rollup
  const allSectionResults: ReturnType<typeof analyzeSection>[] = [];

  const documents = Array.from(docMap.entries())
    .filter(([, events]) => events.some((e) => e.docStatus === 4))
    .map(([docId, events]) => {
      const { isCompleted, cycleTime, stage_durations, bottleneck, rejectCount } =
        analyzeDocument(events);

      if (isCompleted) {
        completedWorkflows++;
        if (cycleTime !== null) cycleTimes.push(cycleTime);
        const esignEvent = events.find((e) => e.docStatus === 4);
        if (esignEvent) {
          completedDocMeta.push({ cycleTime, esignDate: parseInt(esignEvent.date) });
        }
      }

      const docSections = Array.from(sectionMap.entries())
        .filter(([, sEvents]) => sEvents[0]?.section?.doc?.id === docId)
        .map(([sectionId, sEvents]) => {
          const sResult = analyzeSection(sEvents);
          allSectionResults.push(sResult);

          const sectionClauses = Array.from(clauseMap.entries())
            .filter(([, cEvents]) => cEvents[0]?.clause?.section?.id === sectionId)
            .map(([clauseId, cEvents]) => {
              const { memberName, stage_durations: cStages, bottleneck: cBn, rejectCount: cRej, reassignCount: cRea } =
                analyzeClause(cEvents);
              return {
                clause_id: clauseId,
                member: memberName,
                stage_durations: cStages,
                bottleneck: cBn,
                reject_count: cRej,
                reassign_count: cRea,
              };
            });

          return {
            section_id: sectionId,
            division: sResult.division,
            leader: sResult.leaderName,
            stage_durations: sResult.stage_durations,
            bottleneck: sResult.bottleneck,
            reject_count: sResult.rejectCount,
            reassign_count: sResult.reassignCount,
            clauses: sectionClauses,
          };
        });

      return {
        document_id: docId,
        cycle_time: cycleTime,
        stage_durations,
        bottleneck,
        reject_count: rejectCount,
        sections: docSections,
      };
    });

  const averageCycleTime = avg(cycleTimes);
  const completionRate =
    totalWorkflows > 0
      ? Math.round((completedWorkflows / totalWorkflows) * 10000) / 100
      : 0;

  return {
    summary: {
      total_workflows: totalWorkflows,
      completed_workflows: completedWorkflows,
      completion_rate_percent: completionRate,
      average_cycle_time: averageCycleTime,
      time_unit: 'seconds',
    },
    throughput_by_week: buildThroughput(completedDocMeta),
    division_rollup: buildDivisionRollup(allSectionResults),
    documents,
  };
}
