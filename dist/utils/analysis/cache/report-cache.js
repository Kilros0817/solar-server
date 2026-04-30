"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrBuildReport = void 0;
const redis_1 = require("./redis");
const report_builder_1 = require("../core/report-builder");
const getOrBuildReport = async () => {
    try {
        const subgraphData = await (0, redis_1.getSubgraphDataWithCache)();
        if (!subgraphData)
            return null;
        const { data, hash: dataHash } = subgraphData;
        const report = (0, report_builder_1.buildReport)(data);
        return { report, dataHash };
    }
    catch (error) {
        console.error('Error building report:', error);
        return null;
    }
};
exports.getOrBuildReport = getOrBuildReport;
