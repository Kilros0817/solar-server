"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubgraphDataWithCache = exports.getSubgraphDataCacheKey = exports.getReportCacheKey = exports.REPORT_CACHE_TTL_SECONDS = void 0;
const crypto_1 = __importDefault(require("crypto"));
const subgraph_1 = require("../../../routes/subgraph");
const types_1 = require("../core/types");
exports.REPORT_CACHE_TTL_SECONDS = 600;
const getReportCacheKey = (dataHash) => {
    return `analysis:report:${dataHash}`;
};
exports.getReportCacheKey = getReportCacheKey;
const getSubgraphDataCacheKey = () => {
    return 'analysis:subgraph:data';
};
exports.getSubgraphDataCacheKey = getSubgraphDataCacheKey;
const getSubgraphDataWithCache = async () => {
    try {
        const redis = await (0, subgraph_1.getRedisClient)();
        const cachedData = await redis.get((0, exports.getSubgraphDataCacheKey)());
        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            const dataHash = crypto_1.default.createHash('sha256').update(cachedData).digest('hex');
            return { data: parsedData, hash: dataHash };
        }
        const raw = await (0, subgraph_1.querySubgraph)(types_1.HISTORIES_QUERY);
        if (!raw) {
            return null;
        }
        const dataString = JSON.stringify(raw);
        const dataHash = crypto_1.default.createHash('sha256').update(dataString).digest('hex');
        await redis.setEx((0, exports.getSubgraphDataCacheKey)(), exports.REPORT_CACHE_TTL_SECONDS, dataString);
        return { data: raw, hash: dataHash };
    }
    catch (error) {
        console.warn('Redis cache error, fetching fresh data:', error);
        const raw = await (0, subgraph_1.querySubgraph)(types_1.HISTORIES_QUERY);
        if (!raw) {
            return null;
        }
        const dataString = JSON.stringify(raw);
        const dataHash = crypto_1.default.createHash('sha256').update(dataString).digest('hex');
        return { data: raw, hash: dataHash };
    }
};
exports.getSubgraphDataWithCache = getSubgraphDataWithCache;
