import express, { Request, Response } from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { HttpsProxyAgent } = require('https-proxy-agent');
import { querySubgraph } from './subgraph';

dotenv.config();

const router = express.Router();

const proxyAgent = process.env.GROQ_PROXY
  ? new HttpsProxyAgent(process.env.GROQ_PROXY)
  : undefined;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  ...(proxyAgent && { fetchOptions: { agent: proxyAgent } }),
});

const DEFAULT_MODEL = 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `You are a senior data analyst specializing in workflow and process analytics.

Your task is to analyze structured smart contract event data from a contract management system and produce a precise, data-driven report.

## INPUT

You will receive JSON data of all workflows.

## DATA TYPE
{
  "docHistories": [
    {
      "type": 0,             // 0:created 1:request 2:approve 3:reject 4:clientEsign 5:legalEsign 6:reassign
      "date": "1772345708",  // Unix timestamp
      "document": {
        "status": 0          // 0:pending 1:request 2:approved 3:rejected 4:esigned
      }
    }
  ]
}

## RULES (STRICT)

* Use ONLY the provided data. Do NOT assume missing values.
* If required data is missing, explicitly state: "Insufficient data".
* All calculations must be accurate and reproducible.
* Do NOT hallucinate workflows, steps, or users.
* Use consistent units (seconds, minutes, or hours — choose one and stick to it).
* Round percentages to 2 decimal places.

## DEFINITIONS

* Workflow = a complete contract process instance
* Completed workflow = workflow with final document status = 4 (esigned)
* Cycle time = (last step timestamp - first step timestamp)
* Step duration = time between consecutive events
* Bottleneck = step with the highest average duration OR highest % of total cycle time

## REQUIRED OUTPUT FORMAT (STRICT JSON)

{
  "summary": {
    "total_workflows": number,
    "completed_workflows": number,
    "completion_rate_percent": number,
    "average_cycle_time": number,
    "time_unit": "string"
  },
  "cycle_time_analysis": {
    "steps": [
      {
        "step_name": "string",
        "average_duration": number,
        "percentage_of_total_time": number
      }
    ]
  },
  "bottleneck": {
    "step_name": "string",
    "average_duration": number,
    "percentage_of_total_time": number,
    "reason": "string"
  }
}

## ANALYSIS INSTRUCTIONS

1. Compute total workflows, completed workflows, and completion rate = (completed / total) * 100
2. Compute cycle time per workflow: last event timestamp - first event timestamp
3. Compute average cycle time across all workflows
4. For each step type, calculate average duration and % of total workflow time
5. Identify the bottleneck: step with highest average duration or highest % of total time
6. Ensure sum of step percentages ≈ 100%

## EDGE CASE HANDLING

* No completed workflows → completion_rate = 0
* Missing timestamps → exclude from calculations and note it
* Inconsistent step durations → report data quality issue

## STYLE

* Output ONLY valid JSON — no markdown, no code fences, no explanations outside JSON
* Keep explanations concise inside "reason" fields only
`;

const DOC_HISTORIES_QUERY = `{
  docHistories(orderBy: date) {
    type
    date
    document {
      status
    }
  }
}`;

/**
 * POST /agent/getReport
 * No body required — fetches docHistories from subgraph internally and returns AI report.
 */
router.post('/getReport', async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Fetch data from subgraph (uses Redis cache automatically)
    const subgraphData = await querySubgraph(DOC_HISTORIES_QUERY);

    if (!subgraphData) {
      res.status(502).json({ isSuccess: false, error: 'Failed to fetch data from subgraph' });
      return;
    }

    // 2. Send to Groq for analysis
    const completion = await groq.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(subgraphData) },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    });

    const raw = completion.choices[0]?.message?.content ?? '';

    // 3. Parse JSON report from model response
    let report: unknown;
    try {
      report = JSON.parse(raw);
    } catch {
      report = raw;
    }

    res.json({
      isSuccess: true,
      report,
      usage: completion.usage,
    });
  } catch (error) {
    console.error('Agent getReport error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

export default router;
