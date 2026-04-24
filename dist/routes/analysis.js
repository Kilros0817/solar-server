"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subgraph_1 = require("./subgraph");
const analysis_1 = require("../utils/analysis");
const router = express_1.default.Router();
router.get('/report', async (_req, res) => {
    try {
        const raw = await (0, subgraph_1.querySubgraph)(analysis_1.HISTORIES_QUERY);
        if (!raw) {
            res.status(502).json({ isSuccess: false, error: 'Failed to fetch data from subgraph' });
            return;
        }
        const report = (0, analysis_1.buildReport)(raw);
        res.json({ isSuccess: true, report });
    }
    catch (error) {
        console.error('Analysis report error:', error);
        res.status(500).json({ isSuccess: false, error: String(error) });
    }
});
exports.default = router;
