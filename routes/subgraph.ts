import express, { Request, Response } from 'express';
// import { createClient } from 'redis'; // Redis disabled
import dotenv from 'dotenv';

dotenv.config();

const SUBGRAPH_URL = process.env.SUBGRAPH_URL ?? 'https://api.studio.thegraph.com/query/72239/solar-dms-graph/version/latest';

// Redis disabled — REDIS_URL and CACHE_TTL_SECONDS are no longer used
// const REDIS_URL = `redis://:${encodeURIComponent(process.env.REDIS_PASSWORD ?? '')}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
// const CACHE_TTL_SECONDS = parseInt(String(process.env.SUBGRAPH_CACHE_TTL || '60'), 10);

const router = express.Router();

// Redis disabled — getRedisClient is kept as a stub so existing imports don't break
export const getRedisClient = async (): Promise<never> => {
  throw new Error('Redis is disabled');
};

/**
 * Reusable function to query the subgraph directly (Redis caching disabled).
 * Can be imported and used by other routes (e.g. agent.ts).
 */
export const querySubgraph = async (query: string, _bypassCache = false): Promise<unknown> => {
  const subgraphRes = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const json = (await subgraphRes.json()) as { data?: unknown };
  return json?.data ?? json;
};

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body as { query?: string };
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'query string is required' });
      return;
    }

    const data = await querySubgraph(query);

    res.json({ isSuccess: true, data });
  } catch (error) {
    console.error('Subgraph proxy error:', error);
    res.status(500).json({ isSuccess: false, data: '', error: String(error) });
  }
});

export default router;
