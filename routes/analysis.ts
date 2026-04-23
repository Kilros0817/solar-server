import express, { Request, Response } from 'express';
import { querySubgraph } from './subgraph';
import { buildReport, SubgraphData } from '../utils/analysis';
import { DOC_SECTION_HISTORIES_QUERY } from '../utils/agentConfig';

const router = express.Router();

/**
 * GET /analysis/report
 * Fetches docHistories + sectionHistories from subgraph and returns a
 * computed workflow analytics report — no AI involved.
 */
router.get('/report', async (_req: Request, res: Response): Promise<void> => {
  try {
    const raw = await querySubgraph(DOC_SECTION_HISTORIES_QUERY) as SubgraphData;

    if (!raw) {
      res.status(502).json({ isSuccess: false, error: 'Failed to fetch data from subgraph' });
      return;
    }

    const report = buildReport(raw);

    res.json({ isSuccess: true, report });
  } catch (error) {
    console.error('Analysis report error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

export default router;
