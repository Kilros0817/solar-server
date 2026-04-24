"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HISTORIES_QUERY = void 0;
exports.buildReport = buildReport;
exports.HISTORIES_QUERY = `{
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
const DIVISION_MAP = {
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
function toDiv(dcategory) {
    return DIVISION_MAP[dcategory] ?? 'NoDivision';
}
function avg(values) {
    if (values.length === 0)
        return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
function groupBy(arr, key) {
    const map = new Map();
    for (const item of arr) {
        const k = key(item);
        if (!map.has(k))
            map.set(k, []);
        map.get(k).push(item);
    }
    return map;
}
function pickBottleneck(stages) {
    return (stages
        .filter((s) => s.duration !== null)
        .sort((a, b) => b.duration - a.duration)[0] ?? {
        stage: stages[0]?.stage ?? 'unknown',
        duration: null,
    });
}
function analyzeDocument(events) {
    const sorted = [...events].sort((a, b) => parseInt(a.date) - parseInt(b.date));
    const esignEvent = sorted.find((e) => e.docStatus === 4);
    const isCompleted = !!esignEvent;
    let cycleTime = null;
    if (isCompleted && sorted.length >= 2) {
        cycleTime = parseInt(esignEvent.date) - parseInt(sorted[0].date);
    }
    const trimmed = esignEvent
        ? sorted.slice(0, sorted.indexOf(esignEvent) + 1)
        : sorted;
    const firstEventTime = parseInt(trimmed[0].date);
    const requestEvent = trimmed.find((e) => e.type === 1);
    const pendingToRequest = requestEvent && parseInt(requestEvent.date) > firstEventTime
        ? parseInt(requestEvent.date) - firstEventTime
        : null;
    const firstRequest = trimmed.find((e) => e.type === 1);
    const lastApprove = [...trimmed].reverse().find((e) => e.type === 2);
    const requestToApproved = firstRequest && lastApprove && parseInt(lastApprove.date) > parseInt(firstRequest.date)
        ? parseInt(lastApprove.date) - parseInt(firstRequest.date)
        : null;
    let approvedToEsigned = null;
    if (lastApprove) {
        const approvedTime = parseInt(lastApprove.date);
        const esignAfterApprove = trimmed.find((e) => (e.type === 4 || e.type === 5) && parseInt(e.date) > approvedTime);
        if (esignAfterApprove) {
            approvedToEsigned = parseInt(esignAfterApprove.date) - approvedTime;
        }
    }
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
function analyzeSection(events) {
    const sorted = [...events].sort((a, b) => parseInt(a.date) - parseInt(b.date));
    const leader = sorted[0]?.section?.divisionLeader;
    const division = leader ? toDiv(leader.dcategory) : 'NoDivision';
    const leaderName = leader ? `${leader.firstName} ${leader.lastName}` : null;
    const assignEvent = sorted.find((e) => e.type === 0);
    const requestAfterAssign = assignEvent
        ? sorted.find((e) => e.type === 1 && parseInt(e.date) > parseInt(assignEvent.date))
        : null;
    const assignToRequest = assignEvent && requestAfterAssign
        ? parseInt(requestAfterAssign.date) - parseInt(assignEvent.date)
        : null;
    const firstRequest = sorted.find((e) => e.type === 1);
    const lastApprove = [...sorted].reverse().find((e) => e.type === 2);
    const requestToApprove = firstRequest && lastApprove && parseInt(lastApprove.date) > parseInt(firstRequest.date)
        ? parseInt(lastApprove.date) - parseInt(firstRequest.date)
        : null;
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
function analyzeClause(events) {
    const sorted = [...events].sort((a, b) => parseInt(a.date) - parseInt(b.date));
    const member = sorted[0]?.clause?.divisionMember;
    const memberName = member ? `${member.firstName} ${member.lastName}` : null;
    const assignEvent = sorted.find((e) => e.type === 0);
    const requestAfterAssign = assignEvent
        ? sorted.find((e) => e.type === 1 && parseInt(e.date) > parseInt(assignEvent.date))
        : null;
    const assignToRequest = assignEvent && requestAfterAssign
        ? parseInt(requestAfterAssign.date) - parseInt(assignEvent.date)
        : null;
    const firstRequest = sorted.find((e) => e.type === 1);
    const lastApprove = [...sorted].reverse().find((e) => e.type === 2);
    const requestToApprove = firstRequest && lastApprove && parseInt(lastApprove.date) > parseInt(firstRequest.date)
        ? parseInt(lastApprove.date) - parseInt(firstRequest.date)
        : null;
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
function buildDivisionRollup(sectionResults) {
    const divMap = new Map();
    for (const s of sectionResults) {
        if (!divMap.has(s.division)) {
            divMap.set(s.division, { assignToRequest: [], requestToApprove: [], rejects: 0, reassigns: 0 });
        }
        const d = divMap.get(s.division);
        const a2r = s.stage_durations.find((x) => x.stage === 'assign_to_request')?.duration;
        const r2a = s.stage_durations.find((x) => x.stage === 'request_to_approve')?.duration;
        if (a2r !== null && a2r !== undefined)
            d.assignToRequest.push(a2r);
        if (r2a !== null && r2a !== undefined)
            d.requestToApprove.push(r2a);
        d.rejects += s.rejectCount;
        d.reassigns += s.reassignCount;
    }
    const result = {};
    for (const [division, d] of divMap.entries()) {
        const avgA2R = avg(d.assignToRequest);
        const avgR2A = avg(d.requestToApprove);
        let bottleneckStage = null;
        if (avgA2R !== null && avgR2A !== null) {
            bottleneckStage = avgA2R >= avgR2A ? 'assign_to_request' : 'request_to_approve';
        }
        else if (avgA2R !== null) {
            bottleneckStage = 'assign_to_request';
        }
        else if (avgR2A !== null) {
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
function buildThroughput(completedDocs) {
    const weekly = {};
    for (const doc of completedDocs) {
        const date = new Date(doc.esignDate * 1000);
        const year = date.getUTCFullYear();
        const startOfYear = new Date(Date.UTC(year, 0, 1));
        const week = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7);
        const key = `${year}-W${String(week).padStart(2, '0')}`;
        weekly[key] = (weekly[key] ?? 0) + 1;
    }
    return weekly;
}
function buildReport(data) {
    const { docHistories, sectionHistories, clauseHistories } = data;
    const docMap = groupBy(docHistories, (e) => e.document.id);
    const sectionMap = groupBy(sectionHistories, (e) => e.section.id);
    const clauseMap = groupBy(clauseHistories ?? [], (e) => e.clause.id);
    const totalWorkflows = docMap.size;
    let completedWorkflows = 0;
    const cycleTimes = [];
    const completedDocMeta = [];
    const allSectionResults = [];
    const documents = Array.from(docMap.entries())
        .filter(([, events]) => events.some((e) => e.docStatus === 4))
        .map(([docId, events]) => {
        const { isCompleted, cycleTime, stage_durations, bottleneck, rejectCount } = analyzeDocument(events);
        if (isCompleted) {
            completedWorkflows++;
            if (cycleTime !== null)
                cycleTimes.push(cycleTime);
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
                const { memberName, stage_durations: cStages, bottleneck: cBn, rejectCount: cRej, reassignCount: cRea } = analyzeClause(cEvents);
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
    const completionRate = totalWorkflows > 0
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
