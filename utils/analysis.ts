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

export interface SubgraphData {
  docHistories: DocHistory[];
  sectionHistories: SectionHistory[];
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
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ─── Document analysis ────────────────────────────────────────────────────────

function analyzeDocument(events: DocHistory[]) {
  // Sort ascending by date
  const sorted = [...events].sort((a, b) => parseInt(a.date) - parseInt(b.date));

  // Completion: first event where docStatus === 4
  const esignEvent = sorted.find((e) => e.docStatus === 4);
  const isCompleted = !!esignEvent;

  // Cycle time: first_event → first docStatus=4 event
  let cycleTime: number | null = null;
  if (isCompleted && sorted.length >= 2) {
    cycleTime = parseInt(esignEvent!.date) - parseInt(sorted[0].date);
  }

  // Trim events to only those up to and including the first docStatus=4
  const trimmed = esignEvent
    ? sorted.slice(0, sorted.indexOf(esignEvent) + 1)
    : sorted;

  // Step 1: pending_to_request
  // first_event_time → first type=1
  const firstEventTime = parseInt(trimmed[0].date);
  const requestEvent = trimmed.find((e) => e.type === 1);
  const pendingToRequest =
    requestEvent && parseInt(requestEvent.date) > firstEventTime
      ? parseInt(requestEvent.date) - firstEventTime
      : null;

  // Step 2: request_to_approved
  // first type=1 → last type=2
  const firstRequest = trimmed.find((e) => e.type === 1);
  const lastApprove = [...trimmed].reverse().find((e) => e.type === 2);
  const requestToApproved =
    firstRequest && lastApprove && parseInt(lastApprove.date) > parseInt(firstRequest.date)
      ? parseInt(lastApprove.date) - parseInt(firstRequest.date)
      : null;

  // Step 3: approved_to_esigned
  // last type=2 → first type=4 or type=5 after it
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

  // Bottleneck: stage with highest non-null duration
  const stages: { stage: string; average_duration: number | null }[] = [
    { stage: 'pending_to_request', average_duration: pendingToRequest },
    { stage: 'request_to_approved', average_duration: requestToApproved },
    { stage: 'approved_to_esigned', average_duration: approvedToEsigned },
  ];

  const bottleneck = stages
    .filter((s) => s.average_duration !== null)
    .sort((a, b) => b.average_duration! - a.average_duration!)[0] ?? {
    stage: stages[0].stage,
    average_duration: null,
  };

  return { isCompleted, cycleTime, bottleneck };
}

// ─── Section analysis ─────────────────────────────────────────────────────────

function analyzeSection(events: SectionHistory[]) {
  // Sort ascending
  const sorted = [...events].sort((a, b) => parseInt(a.date) - parseInt(b.date));

  const leader = sorted[0]?.section?.divisionLeader;
  const division = leader ? toDiv(leader.dcategory) : 'NoDivision';
  const leaderName = leader ? `${leader.firstName} ${leader.lastName}` : null;

  // Step 1: assign_to_request
  // first type=0 → first type=1 after it
  const assignEvent = sorted.find((e) => e.type === 0);
  const requestAfterAssign = assignEvent
    ? sorted.find((e) => e.type === 1 && parseInt(e.date) > parseInt(assignEvent.date))
    : null;
  const assignToRequest =
    assignEvent && requestAfterAssign
      ? parseInt(requestAfterAssign.date) - parseInt(assignEvent.date)
      : null;

  // Step 2: request_to_approve
  // first type=1 → last type=2
  const firstRequest = sorted.find((e) => e.type === 1);
  const lastApprove = [...sorted].reverse().find((e) => e.type === 2);
  const requestToApprove =
    firstRequest && lastApprove && parseInt(lastApprove.date) > parseInt(firstRequest.date)
      ? parseInt(lastApprove.date) - parseInt(firstRequest.date)
      : null;

  // Bottleneck
  const stages: { stage: string; average_duration: number | null }[] = [
    { stage: 'assign_to_request', average_duration: assignToRequest },
    { stage: 'request_to_approve', average_duration: requestToApprove },
  ];

  const bottleneck = stages
    .filter((s) => s.average_duration !== null)
    .sort((a, b) => b.average_duration! - a.average_duration!)[0] ?? {
    stage: stages[0].stage,
    average_duration: null,
  };

  return { division, leaderName, bottleneck };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function buildReport(data: SubgraphData) {
  const { docHistories, sectionHistories } = data;

  // Group doc events by document.id
  const docMap = new Map<string, DocHistory[]>();
  for (const event of docHistories) {
    const id = event.document.id;
    if (!docMap.has(id)) docMap.set(id, []);
    docMap.get(id)!.push(event);
  }

  // Group section events by section.id
  const sectionMap = new Map<string, SectionHistory[]>();
  for (const event of sectionHistories) {
    const id = event.section.id;
    if (!sectionMap.has(id)) sectionMap.set(id, []);
    sectionMap.get(id)!.push(event);
  }

  // Analyse each document — only completed ones
  const totalWorkflows = docMap.size;
  let completedWorkflows = 0;
  const cycleTimes: number[] = [];

  const documents = Array.from(docMap.entries())
    .filter(([, events]) => events.some((e) => e.docStatus === 4))
    .map(([docId, events]) => {
      const { isCompleted, cycleTime, bottleneck } = analyzeDocument(events);

      if (isCompleted) {
        completedWorkflows++;
        if (cycleTime !== null) cycleTimes.push(cycleTime);
      }

    // Sections belonging to this document
    const docSections = Array.from(sectionMap.entries())
      .filter(([, sEvents]) => sEvents[0]?.section?.doc?.id === docId)
      .map(([sectionId, sEvents]) => {
        const { division, leaderName, bottleneck: sBn } = analyzeSection(sEvents);
        return {
          section_id: sectionId,
          division,
          leader: leaderName,
          bottleneck: sBn,
        };
      });

    return {
      document_id: docId,
      bottleneck,
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
    documents,
  };
}
