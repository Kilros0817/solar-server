"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrBuildReport = void 0;
const subgraph_1 = require("../../../routes/subgraph");
const redis_1 = require("./redis");
const report_builder_1 = require("../core/report-builder");
const getOrBuildReport = async () => {
    try {
        const subgraphData = await (0, redis_1.getSubgraphDataWithCache)();
        if (!subgraphData) {
            return null;
        }
        const { data, hash: dataHash } = subgraphData;
        const redis = await (0, subgraph_1.getRedisClient)();
        const cachedReport = await redis.get((0, redis_1.getReportCacheKey)(dataHash));
        if (cachedReport) {
            return { report: JSON.parse(cachedReport), dataHash };
        }
        const report = (0, report_builder_1.buildReport)(data);
        await redis.setEx((0, redis_1.getReportCacheKey)(dataHash), redis_1.REPORT_CACHE_TTL_SECONDS, JSON.stringify(report));
        return { report, dataHash };
    }
    catch (error) {
        console.error('Error getting/building report:', error);
        return null;
    }
};
exports.getOrBuildReport = getOrBuildReport;
