import { 
  DocHistory, 
  SectionHistory, 
  ClauseHistory,
  toDiv 
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// Group an array by a key function
export function groupBy<T>(arr: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}

// Pick the bottleneck stage (highest non-null duration)
export function pickBottleneck(stages: { stage: string; duration: number | null }[]) {
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

export function analyzeDocument(events: DocHistory[]) {
  const sorted = [...events].sort((a, b) => a.date - b.date);

  // Completion: first event where doc_status === 4
  const esignEvent = sorted.find((e) => e.doc_status === 4);
  const isCompleted = !!esignEvent;

  // Cycle time: first event → first doc_status=4 event
  let cycleTime: number | null = null;
  if (isCompleted && sorted.length >= 2) {
    cycleTime = esignEvent!.date - sorted[0].date;
  }

  // Trim to events up to and including first doc_status=4
  const trimmed = esignEvent
    ? sorted.slice(0, sorted.indexOf(esignEvent) + 1)
    : sorted;

  const firstEventTime = trimmed[0].date;

  // Stage 1: pending_to_request — first event → first type=1
  const requestEvent = trimmed.find((e) => e.type === 1);
  const pendingToRequest =
    requestEvent && requestEvent.date > firstEventTime
      ? requestEvent.date - firstEventTime
      : null;

  // Stage 2: request_to_approved — first type=1 → last type=2
  const firstRequest = trimmed.find((e) => e.type === 1);
  const lastApprove = [...trimmed].reverse().find((e) => e.type === 2);
  const requestToApproved =
    firstRequest && lastApprove && lastApprove.date > firstRequest.date
      ? lastApprove.date - firstRequest.date
      : null;

  // Stage 3: approved_to_esigned — last type=2 → first type=4 or type=5 after it
  let approvedToEsigned: number | null = null;
  if (lastApprove) {
    const approvedTime = lastApprove.date;
    const esignAfterApprove = trimmed.find(
      (e) => (e.type === 4 || e.type === 5) && e.date > approvedTime,
    );
    if (esignAfterApprove) {
      approvedToEsigned = esignAfterApprove.date - approvedTime;
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

// ─── Common analysis helper ───────────────────────────────────────────────────

interface AssignmentEvent {
  type: number;
  date: number;
}

interface AssignmentAnalysisResult {
  stage_durations: { stage: string; duration: number | null }[];
  bottleneck: ReturnType<typeof pickBottleneck>;
  rejectCount: number;
  reassignCount: number;
}

function analyzeAssignmentEvents<T extends AssignmentEvent, R extends Record<string, any>>(
  events: T[],
  getMetadata?: (sortedEvents: T[]) => R
): AssignmentAnalysisResult & R {
  const sorted = [...events].sort((a, b) => a.date - b.date);

  const metadata = getMetadata ? getMetadata(sorted) : {} as R;

  // Stage 1: assign_to_request — first type=0 → first type=1 after it
  const assignEvent = sorted.find((e) => e.type === 0);
  const requestAfterAssign = assignEvent
    ? sorted.find((e) => e.type === 1 && e.date > assignEvent.date)
    : null;
  const assignToRequest =
    assignEvent && requestAfterAssign
      ? requestAfterAssign.date - assignEvent.date
      : null;

  // Stage 2: request_to_approve — first type=1 → last type=2
  const firstRequest = sorted.find((e) => e.type === 1);
  const lastApprove = [...sorted].reverse().find((e) => e.type === 2);
  const requestToApprove =
    firstRequest && lastApprove && lastApprove.date > firstRequest.date
      ? lastApprove.date - firstRequest.date
      : null;

  // Reject & reassign counts
  const rejectCount = sorted.filter((e) => e.type === 3).length;
  const reassignCount = sorted.filter((e) => e.type === 4).length;

  const stages = [
    { stage: 'assign_to_request', duration: assignToRequest },
    { stage: 'request_to_approve', duration: requestToApprove },
  ];

  return {
    ...metadata,
    stage_durations: stages,
    bottleneck: pickBottleneck(stages),
    rejectCount,
    reassignCount,
  } as AssignmentAnalysisResult & R;
}

// ─── Section analysis ─────────────────────────────────────────────────────────

export function analyzeSection(events: SectionHistory[]) {
  const getMetadata = (sorted: SectionHistory[]) => {
    const leader = sorted[0]?.division_leader;
    return {
      division: 'NoDivision', // Division info not available in history, would need users table join
      leaderName: leader || null,
    };
  };

  return analyzeAssignmentEvents(events, getMetadata);
}

// ─── Clause analysis ──────────────────────────────────────────────────────────

export function analyzeClause(events: ClauseHistory[]) {
  const getMetadata = (sorted: ClauseHistory[]) => {
    const member = sorted[0]?.division_member;
    return {
      memberName: member || null,
    };
  };

  return analyzeAssignmentEvents(events, getMetadata);
}