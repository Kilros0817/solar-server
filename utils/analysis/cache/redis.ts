import crypto from 'crypto';
import { getRedisClient, querySubgraph } from '../../../routes/subgraph';
import { SubgraphData, HISTORIES_QUERY } from '../core/types';

// Cache TTL for report data (10 minutes)
export const REPORT_CACHE_TTL_SECONDS = 600;

/**
 * Helper function to get cache key for report data
 */
export const getReportCacheKey = (dataHash: string): string => {
  return `analysis:report:${dataHash}`;
};

/**
 * Helper function to get cache key for subgraph data
 */
export const getSubgraphDataCacheKey = (): string => {
  return 'analysis:subgraph:data';
};

/**
 * Helper function to get subgraph data with caching
 */
export const getSubgraphDataWithCache = async (): Promise<{ data: SubgraphData; hash: string } | null> => {
  try {
    const redis = await getRedisClient();

    // First, try to get cached subgraph data
    const cachedData = await redis.get(getSubgraphDataCacheKey());
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      const dataHash = crypto.createHash('sha256').update(cachedData).digest('hex');
      return { data: parsedData, hash: dataHash };
    }

    // If no cache, fetch from subgraph
    const raw = await querySubgraph(HISTORIES_QUERY) as SubgraphData;
    if (!raw) {
      return null;
    }

    // Cache the raw data
    const dataString = JSON.stringify(raw);
    const dataHash = crypto.createHash('sha256').update(dataString).digest('hex');

    await redis.setEx(getSubgraphDataCacheKey(), REPORT_CACHE_TTL_SECONDS, dataString);

    return { data: raw, hash: dataHash };
  } catch (error) {
    console.warn('Redis cache error, fetching fresh data:', error);
    const raw = await querySubgraph(HISTORIES_QUERY) as SubgraphData;
    if (!raw) {
      return null;
    }
    const dataString = JSON.stringify(raw);
    const dataHash = crypto.createHash('sha256').update(dataString).digest('hex');
    return { data: raw, hash: dataHash };
  }
};