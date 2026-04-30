"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.querySubgraph = exports.getRedisClient = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SUBGRAPH_URL = process.env.SUBGRAPH_URL ?? 'https://api.studio.thegraph.com/query/72239/solar-dms-graph/version/latest';
const router = express_1.default.Router();
const getRedisClient = async () => {
    throw new Error('Redis is disabled');
};
exports.getRedisClient = getRedisClient;
const querySubgraph = async (query, _bypassCache = false) => {
    const subgraphRes = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });
    const json = (await subgraphRes.json());
    return json?.data ?? json;
};
exports.querySubgraph = querySubgraph;
router.post('/', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== 'string') {
            res.status(400).json({ error: 'query string is required' });
            return;
        }
        const data = await (0, exports.querySubgraph)(query);
        res.json({ isSuccess: true, data });
    }
    catch (error) {
        console.error('Subgraph proxy error:', error);
        res.status(500).json({ isSuccess: false, data: '', error: String(error) });
    }
});
exports.default = router;
