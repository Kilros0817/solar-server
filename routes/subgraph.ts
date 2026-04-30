import express, { Request, Response } from 'express';
import { createClient } from 'redis';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SUBGRAPH_URL = process.env.SUBGRAPH_URL ?? 'https://api.studio.thegraph.com/query/72239/solar-dms-graph/version/latest';
const REDIS_URL = `redis://localhost:6379`;
// const REDIS_URL = `redis://:${encodeURIComponent(process.env.REDIS_PASSWORD ?? '')}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

const CACHE_TTL_SECONDS = parseInt(String(process.env.SUBGRAPH_CACHE_TTL || '60'), 10);

const router = express.Router();

let redisClient: ReturnType<typeof createClient> | null = null;

export const getRedisClient = async () => {
  if (redisClient && redisClient.isOpen) return redisClient;
  
  // Close existing connection if it exists but isn't open
  if (redisClient && !redisClient.isOpen) {
    try {
      await redisClient.quit();
    } catch (e) {
      // Ignore quit errors
    }
    redisClient = null;
  }
  
  redisClient = createClient({ url: REDIS_URL });
  redisClient.on('error', (err) => console.error('Redis error:', err));
  await redisClient.connect();
  return redisClient;
};

const getCacheKey = (query: string) => {
  const normalized = query.replace(/\s+/g, ' ').trim();
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  return `subgraph:${hash}`;
};

/**
 * Reusable function to query the subgraph with Redis caching.
 * Can be imported and used by other routes (e.g. agent.ts).
 */
export const querySubgraph = async (query: string, bypassCache = false): Promise<unknown> => {
  const cacheKey = getCacheKey(query);

  if (!bypassCache) {
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (redisErr) {
      console.warn('Redis cache read failed, querying subgraph directly:', redisErr);
    }
  }

  const subgraphRes = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const json = (await subgraphRes.json()) as { data?: unknown };
  const data = json?.data ?? json;

  try {
    const redis = await getRedisClient();
    await redis.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(data));
  } catch (redisErr) {
    console.warn('Redis cache write failed:', redisErr);
  }

  return data;
};

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body as { query?: string };
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'query string is required' });
      return;
    }

    const bypassCache = req.headers['x-bypass-cache'] === 'true';
    const data = await querySubgraph(query, bypassCache);

    res.json({ isSuccess: true, data });
  } catch (error) {
    console.error('Subgraph proxy error:', error);
    res.status(500).json({ isSuccess: false, data: '', error: String(error) });
  }
});

export default router;
