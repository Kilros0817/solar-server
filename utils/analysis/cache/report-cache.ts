import { AnalysisReport } from '../core/types';
// Redis disabled — getRedisClient and cache key helpers are no longer used
import { getSubgraphDataWithCache } from './redis';
import { buildReport } from '../core/report-builder';

/**
 * Builds a fresh report on every call (Redis caching disabled).
 */
export const getOrBuildReport = async (): Promise<{ report: AnalysisReport; dataHash: string } | null> => {
  try {
    const subgraphData = await getSubgraphDataWithCache();
    if (!subgraphData) return null;

    const { data, hash: dataHash } = subgraphData;
    const report = buildReport(data);

    return { report, dataHash };
  } catch (error) {
    console.error('Error building report:', error);
    return null;
  }
};