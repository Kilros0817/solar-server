"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDivisionRollup = buildDivisionRollup;
const analyzers_1 = require("./analyzers");
function buildDivisionRollup(sectionResults) {
    const divMap = new Map();
    for (const s of sectionResults) {
        let d = divMap.get(s.division);
        if (!d) {
            d = { assignToRequest: [], requestToApprove: [], rejects: 0, reassigns: 0 };
            divMap.set(s.division, d);
        }
        const a2r = s.stage_durations.find((x) => x.stage === 'assign_to_request')?.duration;
        const r2a = s.stage_durations.find((x) => x.stage === 'request_to_approve')?.duration;
        if (a2r != null)
            d.assignToRequest.push(a2r);
        if (r2a != null)
            d.requestToApprove.push(r2a);
        d.rejects += s.rejectCount;
        d.reassigns += s.reassignCount;
    }
    const result = {};
    for (const [division, d] of divMap.entries()) {
        const avgA2R = (0, analyzers_1.avg)(d.assignToRequest);
        const avgR2A = (0, analyzers_1.avg)(d.requestToApprove);
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
