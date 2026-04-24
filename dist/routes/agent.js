"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
const undici_1 = require("undici");
const subgraph_1 = require("./subgraph");
const agentConfig_1 = require("../utils/agentConfig");
dotenv_1.default.config();
const router = express_1.default.Router();
const proxyAgent = process.env.API_PROXY
    ? new undici_1.ProxyAgent(process.env.API_PROXY)
    : null;
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
    fetch: (url, options) => {
        if (!proxyAgent)
            return fetch(url, options);
        return fetch(url, { ...options, dispatcher: proxyAgent });
    },
});
function safeParseJSON(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        return null;
    }
}
async function generateReport(messages) {
    const completion = await openai.chat.completions.create({
        model: agentConfig_1.DEFAULT_MODEL,
        messages,
        temperature: 0,
        max_tokens: 4096,
    });
    return completion.choices[0]?.message?.content ?? '';
}
router.post('/getReport', async (_req, res) => {
    try {
        const subgraphData = await (0, subgraph_1.querySubgraph)(agentConfig_1.DOC_SECTION_HISTORIES_QUERY);
        if (!subgraphData) {
            res.status(502).json({ isSuccess: false, error: 'Failed to fetch data from subgraph' });
            return;
        }
        const baseMessages = [
            { role: 'system', content: agentConfig_1.SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(subgraphData) },
        ];
        let raw = await generateReport(baseMessages);
        let parsed = safeParseJSON(raw);
        if (!parsed) {
            console.warn('First JSON parse failed. Retrying...');
            raw = await generateReport([
                ...baseMessages,
                { role: 'user', content: 'Return ONLY valid JSON. Your previous response was invalid.' },
            ]);
            parsed = safeParseJSON(raw);
        }
        if (!parsed) {
            console.error('Model returned invalid JSON twice:', raw);
            res.status(500).json({ isSuccess: false, error: 'Model returned invalid JSON', raw });
            return;
        }
        res.json({ isSuccess: true, report: parsed });
    }
    catch (error) {
        console.error('Agent getReport error:', error);
        res.status(500).json({ isSuccess: false, error: String(error) });
    }
});
exports.default = router;
