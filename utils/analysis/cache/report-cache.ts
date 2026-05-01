import { AnalysisReport } from '../core/types';
import { getRedisClient } from '../../../routes/subgraph';
import { getReportCacheKey, getSubgraphDataWithCache, REPORT_CACHE_TTL_SECONDS } from './redis';
import { buildReport } from '../core/report-builder';

/**
 * Helper function to get or build report with caching
 */
export const getOrBuildReport = async (): Promise<{ report: AnalysisReport; dataHash: string } | null> => {
  try {
    // Get subgraph data with cache
    const subgraphData = await getSubgraphDataWithCache();
    if (!subgraphData) {
      return null;
    }

    const { data, hash: dataHash } = subgraphData;
    const redis = await getRedisClient();

    // Check if we have cached report for this data hash
    const cachedReport = await redis.get(getReportCacheKey(dataHash));
    if (cachedReport) {
      return { report: JSON.parse(cachedReport), dataHash };
    }

    // Build fresh report
    const report = buildReport(data);

    // Cache the report
    await redis.setEx(getReportCacheKey(dataHash), REPORT_CACHE_TTL_SECONDS, JSON.stringify(report));

    return { report, dataHash };
  } catch (error) {
    console.error('Error getting/building report:', error);
    return null;
  }
};