"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubgraphDataWithCache = exports.getSubgraphDataCacheKey = exports.getReportCacheKey = exports.REPORT_CACHE_TTL_SECONDS = void 0;
const subgraph_1 = require("../../../routes/subgraph");
const types_1 = require("../core/types");
exports.REPORT_CACHE_TTL_SECONDS = 600;
const getReportCacheKey = (_dataHash) => '';
exports.getReportCacheKey = getReportCacheKey;
const getSubgraphDataCacheKey = () => '';
exports.getSubgraphDataCacheKey = getSubgraphDataCacheKey;
const getSubgraphDataWithCache = async () => {
    try {
        const raw = await (0, subgraph_1.querySubgraph)(types_1.HISTORIES_QUERY);
        if (!raw)
            return null;
        return { data: raw, hash: '' };
    }
    catch (error) {
        console.warn('Failed to fetch subgraph data:', error);
        return null;
    }
};
exports.getSubgraphDataWithCache = getSubgraphDataWithCache;
