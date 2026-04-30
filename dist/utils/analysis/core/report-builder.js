"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildReport = buildReport;
const analyzers_1 = require("./analyzers");
const throughput_1 = require("./throughput");
const division_rollup_1 = require("./division-rollup");
function buildReport(data) {
    const { docHistories, sectionHistories, clauseHistories } = data;
    const docMap = (0, analyzers_1.groupBy)(docHistories, (e) => e.document.id);
    const sectionMap = (0, analyzers_1.groupBy)(sectionHistories, (e) => e.section.id);
    const clauseMap = (0, analyzers_1.groupBy)(clauseHistories ?? [], (e) => e.clause.id);
    const totalWorkflows = docMap.size;
    let completedWorkflows = 0;
    const cycleTimes = [];
    const completedDocMeta = [];
    const allSectionResults = [];
    const documents = Array.from(docMap.entries())
        .filter(([, events]) => events.some((e) => e.docStatus === 4))
        .map(([docId, events]) => {
        const docAnalysis = (0, analyzers_1.analyzeDocument)(events);
        if (docAnalysis.isCompleted) {
            completedWorkflows++;
            if (docAnalysis.cycleTime !== null)
                cycleTimes.push(docAnalysis.cycleTime);
            const esignEvent = events.find((e) => e.docStatus === 4);
            if (esignEvent) {
                completedDocMeta.push({
                    cycleTime: docAnalysis.cycleTime,
                    esignDate: parseInt(esignEvent.date)
                });
            }
        }
        const docSections = Array.from(sectionMap.entries())
            .filter(([, sEvents]) => sEvents[0]?.section?.doc?.id === docId)
            .map(([sectionId, sEvents]) => {
            const sResult = (0, analyzers_1.analyzeSection)(sEvents);
            allSectionResults.push(sResult);
            const sectionClauses = Array.from(clauseMap.entries())
                .filter(([, cEvents]) => cEvents[0]?.clause?.section?.id === sectionId)
                .map(([clauseId, cEvents]) => {
                const clauseAnalysis = (0, analyzers_1.analyzeClause)(cEvents);
                return {
                    clause_id: clauseId,
                    member: clauseAnalysis.memberName,
                    stage_durations: clauseAnalysis.stage_durations,
                    bottleneck: clauseAnalysis.bottleneck,
                    reject_count: clauseAnalysis.rejectCount,
                    reassign_count: clauseAnalysis.reassignCount,
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
            cycle_time: docAnalysis.cycleTime,
            stage_durations: docAnalysis.stage_durations,
            bottleneck: docAnalysis.bottleneck,
            reject_count: docAnalysis.rejectCount,
            sections: docSections,
        };
    });
    const averageCycleTime = (0, analyzers_1.avg)(cycleTimes);
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
        throughput_by_week: (0, throughput_1.buildThroughput)(completedDocMeta),
        division_rollup: (0, division_rollup_1.buildDivisionRollup)(allSectionResults),
        documents,
    };
}
