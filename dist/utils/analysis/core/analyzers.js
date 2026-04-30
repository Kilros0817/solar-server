"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.avg = avg;
exports.groupBy = groupBy;
exports.pickBottleneck = pickBottleneck;
exports.analyzeDocument = analyzeDocument;
exports.analyzeSection = analyzeSection;
exports.analyzeClause = analyzeClause;
const types_1 = require("./types");
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
function analyzeAssignmentEvents(events, getMetadata) {
    const sorted = [...events].sort((a, b) => parseInt(a.date) - parseInt(b.date));
    const metadata = getMetadata ? getMetadata(sorted) : {};
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
        ...metadata,
        stage_durations: stages,
        bottleneck: pickBottleneck(stages),
        rejectCount,
        reassignCount,
    };
}
function analyzeSection(events) {
    const getMetadata = (sorted) => {
        const leader = sorted[0]?.section?.divisionLeader;
        return {
            division: leader ? (0, types_1.toDiv)(leader.dcategory) : 'NoDivision',
            leaderName: leader ? `${leader.firstName} ${leader.lastName}` : null,
        };
    };
    return analyzeAssignmentEvents(events, getMetadata);
}
function analyzeClause(events) {
    const getMetadata = (sorted) => {
        const member = sorted[0]?.clause?.divisionMember;
        return {
            memberName: member ? `${member.firstName} ${member.lastName}` : null,
        };
    };
    return analyzeAssignmentEvents(events, getMetadata);
}
