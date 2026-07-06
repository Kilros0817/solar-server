import crypto from 'crypto';
import { getRedisClient } from '../../../routes/postgres';
import { pool } from '../../../utils/database';
import { SubgraphData } from '../core/types';

// Cache TTL for report data (10 minutes)
export const REPORT_CACHE_TTL_SECONDS = 600;

/**
 * Helper function to get cache key for report data
 */
export const getReportCacheKey = (dataHash: string): string => {
  return `analysis:report:${dataHash}`;
};

/**
 * Helper function to get cache key for postgres data
 */
export const getSubgraphDataCacheKey = (): string => {
  return 'analysis:postgres:data';
};

/**
 * Helper function to generate hash from data
 */
const generateDataHash = (data: SubgraphData): string => {
  const dataString = JSON.stringify(data);
  return crypto.createHash('sha256').update(dataString).digest('hex');
};

/**
 * Helper function to get postgres data with caching
 */
export const getSubgraphDataWithCache = async (): Promise<{ data: SubgraphData; hash: string } | null> => {
  try {
    const redis = await getRedisClient();

    // First, try to get cached postgres data
    const cachedData = await redis.get(getSubgraphDataCacheKey());
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      const dataHash = crypto.createHash('sha256').update(cachedData).digest('hex');
      return { data: parsedData, hash: dataHash };
    }

    // If no cache, fetch from postgres
    const [docHistories, sectionHistories, clauseHistories] = await Promise.all([
      pool.query('SELECT type, doc_status, date, doc_id FROM doc_histories ORDER BY date'),
      pool.query('SELECT date, section_status, type, section_id FROM section_histories ORDER BY date'),
      pool.query('SELECT type, date, clause_status, clause_id FROM clause_histories ORDER BY date')
    ]);

    const raw: SubgraphData = {
      docHistories: docHistories.rows,
      sectionHistories: sectionHistories.rows,
      clauseHistories: clauseHistories.rows
    };

    // Cache the raw data
    const dataHash = generateDataHash(raw);
    await redis.setEx(getSubgraphDataCacheKey(), REPORT_CACHE_TTL_SECONDS, JSON.stringify(raw));

    return { data: raw, hash: dataHash };
  } catch (error) {
    console.warn('Redis cache error, fetching fresh data:', error);
    
    try {
      const [docHistories, sectionHistories, clauseHistories] = await Promise.all([
        pool.query('SELECT type, doc_status, date, doc_id FROM doc_histories ORDER BY date'),
        pool.query('SELECT date, section_status, type, section_id FROM section_histories ORDER BY date'),
        pool.query('SELECT type, date, clause_status, clause_id FROM clause_histories ORDER BY date')
      ]);

      const raw: SubgraphData = {
        docHistories: docHistories.rows,
        sectionHistories: sectionHistories.rows,
        clauseHistories: clauseHistories.rows
      };
      
      const dataHash = generateDataHash(raw);
      return { data: raw, hash: dataHash };
    } catch (postgresError) {
      console.error('PostgreSQL query error:', postgresError);
      return null;
    }
  }
};