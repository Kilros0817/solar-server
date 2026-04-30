"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildThroughput = buildThroughput;
function buildThroughput(completedDocs) {
    const weekly = {};
    for (const doc of completedDocs) {
        const date = new Date(doc.esignDate * 1000);
        const year = date.getUTCFullYear();
        const janFirst = new Date(Date.UTC(year, 0, 1));
        const diffMs = date.getTime() - janFirst.getTime();
        const week = Math.floor(diffMs / (7 * 24 * 3600 * 1000)) + 1;
        const key = `${year}-W${String(week).padStart(2, '0')}`;
        weekly[key] = (weekly[key] ?? 0) + 1;
    }
    return weekly;
}
