import { DivisionStats } from './types';
import { avg } from './analyzers';

export function buildDivisionRollup(
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
    let d = divMap.get(s.division);
    if (!d) {
      d = { assignToRequest: [], requestToApprove: [], rejects: 0, reassigns: 0 };
      divMap.set(s.division, d);
    }
    
    const a2r = s.stage_durations.find((x) => x.stage === 'assign_to_request')?.duration;
    const r2a = s.stage_durations.find((x) => x.stage === 'request_to_approve')?.duration;
    
    if (a2r != null) d.assignToRequest.push(a2r);
    if (r2a != null) d.requestToApprove.push(r2a);
    
    d.rejects += s.rejectCount;
    d.reassigns += s.reassignCount;
  }

  const result: Record<string, DivisionStats> = {};
  
  for (const [division, d] of divMap.entries()) {
    const avgA2R = avg(d.assignToRequest);
    const avgR2A = avg(d.requestToApprove);
    
    // Determine bottleneck
    let bottleneckStage: string | null = null;
    if (avgA2R !== null && avgR2A !== null) {
      bottleneckStage = avgA2R >= avgR2A ? 'assign_to_request' : 'request_to_approve';
    } else if (avgA2R !== null) {
      bottleneckStage = 'assign_to_request';
    } else if (avgR2A !== null) {
      bottleneckStage = 'request_to_approve';
    }

    result[division] = {
      section_count: Math.max(d.assignToRequest.length, d.requestToApprove.length),
      avg_assign_to_request: avgA2R,
      avg_request_to_approve: avgR2A,
      total_rejects: d.rejects,
      total_reassigns: d.reassigns,
      bottleneck_stage: bottleneckStage,
    };
  }

  return result;
}