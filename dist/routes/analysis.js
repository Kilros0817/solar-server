"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
const undici_1 = require("undici");
const analysis_1 = require("../utils/analysis");
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
router.get('/report', async (_req, res) => {
    try {
        const result = await (0, analysis_1.getOrBuildReport)();
        if (!result) {
            res.status(502).json({ isSuccess: false, error: 'Failed to fetch data from subgraph' });
            return;
        }
        res.json({ isSuccess: true, report: result.report });
    }
    catch (error) {
        console.error('Analysis report error:', error);
        res.status(500).json({ isSuccess: false, error: String(error) });
    }
});
router.get('/download-report', async (_req, res) => {
    try {
        const result = await (0, analysis_1.getOrBuildReport)();
        if (!result) {
            res.status(502).json({ isSuccess: false, error: 'Failed to fetch data from subgraph' });
            return;
        }
        const { report } = result;
        const prompt = `Create an analytics report for contract management system.

      Metrics:
      - Total: ${report.summary.total_workflows} workflows
      - Completed: ${report.summary.completed_workflows} (${report.summary.completion_rate_percent}%)
      - Avg Cycle: ${report.summary.average_cycle_time ? Math.round(report.summary.average_cycle_time / 3600) + ' hours' : 'N/A'}
      - Divisions: ${Object.keys(report.division_rollup).length}
      - Documents: ${report.documents.length} analyzed

      Return clean HTML for PDF conversion. Use h1, h2, h3, p, ul, li tags. Include:
      1. Executive Summary
      2. Key Metrics
      3. Division Performance
      4. Bottleneck Analysis
      5. Recommendations
      6. Technical Details

      Return ONLY HTML content.`;
        if (!openai) {
            throw new Error('OpenAI client not initialized');
        }
        let completion;
        try {
            completion = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'Create HTML reports for PDF conversion. Return clean HTML with h1, h2, h3, p, ul, li tags. No markdown or explanations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 4000
            });
        }
        catch (openaiError) {
            console.error('OpenAI API call failed:', openaiError);
            throw new Error(`OpenAI API error: ${openaiError.message || 'Unknown error'}`);
        }
        if (!completion.choices || completion.choices.length === 0) {
            throw new Error('OpenAI API returned no response choices');
        }
        const reportContent = completion.choices[0].message.content;
        if (!reportContent) {
            throw new Error('OpenAI API returned empty response content');
        }
        const pdfBuffer = await (0, analysis_1.generatePDFFromHTML)(reportContent);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${Date.now()}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length.toString());
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Download report error:', error);
        try {
            const result = await (0, analysis_1.getOrBuildReport)();
            if (result) {
                const { report } = result;
                const basicReport = `# Analytics Report

          ## Summary
          - Total Workflows: ${report.summary.total_workflows}
          - Completed Workflows: ${report.summary.completed_workflows}
          - Completion Rate: ${report.summary.completion_rate_percent}%
          - Average Cycle Time: ${report.summary.average_cycle_time ? report.summary.average_cycle_time + ' seconds' : 'N/A'}

          ## Note
          OpenAI report generation failed. This is a basic report.

          Error: ${typeof error === 'string' ? error.substring(0, 200) : String(error).substring(0, 200)}

          Generated: ${new Date().toLocaleString()}`;
                const htmlContent = (0, analysis_1.markdownToHTML)(basicReport);
                const pdfBuffer = await (0, analysis_1.generatePDFFromHTML)(htmlContent);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="analytics-report-basic-${Date.now()}.pdf"`);
                res.setHeader('Content-Length', pdfBuffer.length.toString());
                res.send(pdfBuffer);
                return;
            }
        }
        catch (fallbackError) {
            console.error('Fallback report generation also failed:', fallbackError);
        }
        res.status(500).json({
            isSuccess: false,
            error: String(error),
            message: 'Failed to generate report'
        });
    }
});
exports.default = router;
