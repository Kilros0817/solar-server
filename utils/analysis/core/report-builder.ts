import { SubgraphData, AnalysisReport } from './types';
import { groupBy, analyzeDocument, analyzeSection, analyzeClause, avg } from './analyzers';
import { buildThroughput } from './throughput';
import { buildDivisionRollup } from './division-rollup';

export function buildReport(data: SubgraphData): AnalysisReport {
  const { docHistories, sectionHistories, clauseHistories } = data;

  // Create maps once
  const docMap = groupBy(docHistories, (e) => e.document.id);
  const sectionMap = groupBy(sectionHistories, (e) => e.section.id);
  const clauseMap = groupBy(clauseHistories ?? [], (e) => e.clause.id);

  const totalWorkflows = docMap.size;
  let completedWorkflows = 0;
  const cycleTimes: number[] = [];
  const completedDocMeta: { cycleTime: number | null; esignDate: number }[] = [];
  const allSectionResults: ReturnType<typeof analyzeSection>[] = [];

  // Process only completed documents
  const documents = Array.from(docMap.entries())
    .filter(([, events]) => events.some((e) => e.docStatus === 4))
    .map(([docId, events]) => {
      const docAnalysis = analyzeDocument(events);

      if (docAnalysis.isCompleted) {
        completedWorkflows++;
        if (docAnalysis.cycleTime !== null) cycleTimes.push(docAnalysis.cycleTime);
        const esignEvent = events.find((e) => e.docStatus === 4);
        if (esignEvent) {
          completedDocMeta.push({ 
            cycleTime: docAnalysis.cycleTime, 
            esignDate: parseInt(esignEvent.date) 
          });
        }
      }

      // Process sections for this document
      const docSections = Array.from(sectionMap.entries())
        .filter(([, sEvents]) => sEvents[0]?.section?.doc?.id === docId)
        .map(([sectionId, sEvents]) => {
          const sResult = analyzeSection(sEvents);
          allSectionResults.push(sResult);

          // Process clauses for this section
          const sectionClauses = Array.from(clauseMap.entries())
            .filter(([, cEvents]) => cEvents[0]?.clause?.section?.id === sectionId)
            .map(([clauseId, cEvents]) => {
              const clauseAnalysis = analyzeClause(cEvents);
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