"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.querySubgraph = exports.getRedisClient = void 0;
const express_1 = __importDefault(require("express"));
const redis_1 = require("redis");
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SUBGRAPH_URL = process.env.SUBGRAPH_URL ?? 'https://api.studio.thegraph.com/query/72239/solar-dms-graph/version/latest';
const REDIS_URL = `redis://localhost:6379`;
const CACHE_TTL_SECONDS = parseInt(String(process.env.SUBGRAPH_CACHE_TTL || '60'), 10);
const router = express_1.default.Router();
let redisClient = null;
const getRedisClient = async () => {
    if (redisClient && redisClient.isOpen)
        return redisClient;
    if (redisClient && !redisClient.isOpen) {
        try {
            await redisClient.quit();
        }
        catch (e) {
        }
        redisClient = null;
    }
    redisClient = (0, redis_1.createClient)({ url: REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis error:', err));
    await redisClient.connect();
    return redisClient;
};
exports.getRedisClient = getRedisClient;
const getCacheKey = (query) => {
    const normalized = query.replace(/\s+/g, ' ').trim();
    const hash = crypto_1.default.createHash('sha256').update(normalized).digest('hex');
    return `subgraph:${hash}`;
};
const querySubgraph = async (query, bypassCache = false) => {
    const cacheKey = getCacheKey(query);
    if (!bypassCache) {
        try {
            const redis = await (0, exports.getRedisClient)();
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        catch (redisErr) {
            console.warn('Redis cache read failed, querying subgraph directly:', redisErr);
        }
    }
    const subgraphRes = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });
    const json = (await subgraphRes.json());
    const data = json?.data ?? json;
    try {
        const redis = await (0, exports.getRedisClient)();
        await redis.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(data));
    }
    catch (redisErr) {
        console.warn('Redis cache write failed:', redisErr);
    }
    return data;
};
exports.querySubgraph = querySubgraph;
router.post('/', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== 'string') {
            res.status(400).json({ error: 'query string is required' });
            return;
        }
        const bypassCache = req.headers['x-bypass-cache'] === 'true';
        const data = await (0, exports.querySubgraph)(query, bypassCache);
        res.json({ isSuccess: true, data });
    }
    catch (error) {
        console.error('Subgraph proxy error:', error);
        res.status(500).json({ isSuccess: false, data: '', error: String(error) });
    }
});
exports.default = router;
