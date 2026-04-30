// Redis disabled — this file is kept as a stub so existing imports don't break
import { querySubgraph } from '../../../routes/subgraph';
import { SubgraphData, HISTORIES_QUERY } from '../core/types';

// Redis disabled — TTL and cache key helpers are no-ops
export const REPORT_CACHE_TTL_SECONDS = 600;
export const getReportCacheKey = (_dataHash: string): string => '';
export const getSubgraphDataCacheKey = (): string => '';

/**
 * Fetches subgraph data directly without caching (Redis disabled).
 */
export const getSubgraphDataWithCache = async (): Promise<{ data: SubgraphData; hash: string } | null> => {
  try {
    const raw = await querySubgraph(HISTORIES_QUERY) as SubgraphData;
    if (!raw) return null;
    return { data: raw, hash: '' };
  } catch (error) {
    console.warn('Failed to fetch subgraph data:', error);
    return null;
  }
};