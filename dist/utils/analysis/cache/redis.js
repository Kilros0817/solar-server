"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubgraphDataWithCache = exports.getSubgraphDataCacheKey = exports.getReportCacheKey = exports.REPORT_CACHE_TTL_SECONDS = void 0;
const crypto_1 = __importDefault(require("crypto"));
const redis_service_1 = require("../../../services/redis.service");
const database_1 = require("../../../utils/database");
exports.REPORT_CACHE_TTL_SECONDS = 600;
const getReportCacheKey = (dataHash) => {
    return `analysis:report:${dataHash}`;
};
exports.getReportCacheKey = getReportCacheKey;
const getSubgraphDataCacheKey = () => {
    return 'analysis:postgres:data';
};
exports.getSubgraphDataCacheKey = getSubgraphDataCacheKey;
const generateDataHash = (data) => {
    const dataString = JSON.stringify(data);
    return crypto_1.default.createHash('sha256').update(dataString).digest('hex');
};
const getSubgraphDataWithCache = async () => {
    try {
        const redis = await (0, redis_service_1.getRedisClient)();
        const cachedData = await redis.get((0, exports.getSubgraphDataCacheKey)());
        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            const dataHash = crypto_1.default.createHash('sha256').update(cachedData).digest('hex');
            return { data: parsedData, hash: dataHash };
        }
        const [docHistories, sectionHistories, clauseHistories] = await Promise.all([
            database_1.pool.query('SELECT type, doc_status, date, doc_id FROM doc_histories ORDER BY date'),
            database_1.pool.query('SELECT date, section_status, type, section_id FROM section_histories ORDER BY date'),
            database_1.pool.query('SELECT type, date, clause_status, clause_id FROM clause_histories ORDER BY date')
        ]);
        const raw = {
            docHistories: docHistories.rows,
            sectionHistories: sectionHistories.rows,
            clauseHistories: clauseHistories.rows
        };
        const dataHash = generateDataHash(raw);
        await redis.setEx((0, exports.getSubgraphDataCacheKey)(), exports.REPORT_CACHE_TTL_SECONDS, JSON.stringify(raw));
        return { data: raw, hash: dataHash };
    }
    catch (error) {
        console.warn('Redis cache error, fetching fresh data:', error);
        try {
            const [docHistories, sectionHistories, clauseHistories] = await Promise.all([
                database_1.pool.query('SELECT type, doc_status, date, doc_id FROM doc_histories ORDER BY date'),
                database_1.pool.query('SELECT date, section_status, type, section_id FROM section_histories ORDER BY date'),
                database_1.pool.query('SELECT type, date, clause_status, clause_id FROM clause_histories ORDER BY date')
            ]);
            const raw = {
                docHistories: docHistories.rows,
                sectionHistories: sectionHistories.rows,
                clauseHistories: clauseHistories.rows
            };
            const dataHash = generateDataHash(raw);
            return { data: raw, hash: dataHash };
        }
        catch (postgresError) {
            console.error('PostgreSQL query error:', postgresError);
            return null;
        }
    }
};
exports.getSubgraphDataWithCache = getSubgraphDataWithCache;
