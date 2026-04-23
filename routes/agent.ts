import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { ProxyAgent } from 'undici';
import { querySubgraph } from './subgraph';
import { DEFAULT_MODEL, SYSTEM_PROMPT, DOC_SECTION_HISTORIES_QUERY } from '../utils/agentConfig';

dotenv.config();

const router = express.Router();

const proxyAgent = process.env.API_PROXY
  ? new ProxyAgent(process.env.API_PROXY)
  : null;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  fetch: (url, options) => {
    if (!proxyAgent) return fetch(url, options as RequestInit);
    return fetch(url, { ...(options as RequestInit), dispatcher: proxyAgent } as RequestInit);
  },
});

function safeParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function generateReport(messages: OpenAI.Chat.ChatCompletionMessageParam[]) {
  const completion = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages,
    temperature: 0,
    max_tokens: 4096,
  });
  return completion.choices[0]?.message?.content ?? '';
}

router.post('/getReport', async (_req: Request, res: Response): Promise<void> => {
  try {
    const subgraphData = await querySubgraph(DOC_SECTION_HISTORIES_QUERY);

    if (!subgraphData) {
      res.status(502).json({ isSuccess: false, error: 'Failed to fetch data from subgraph' });
      return;
    }

    const baseMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(subgraphData) },
    ];

    let raw = await generateReport(baseMessages);
    let parsed = safeParseJSON(raw);

    if (!parsed) {
      console.warn('First JSON parse failed. Retrying...');
      raw = await generateReport([
        ...baseMessages,
        { role: 'user' as const, content: 'Return ONLY valid JSON. Your previous response was invalid.' },
      ]);
      parsed = safeParseJSON(raw);
    }

    if (!parsed) {
      console.error('Model returned invalid JSON twice:', raw);
      res.status(500).json({ isSuccess: false, error: 'Model returned invalid JSON', raw });
      return;
    }

    res.json({ isSuccess: true, report: parsed });
  } catch (error) {
    console.error('Agent getReport error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

export default router;
