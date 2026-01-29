import express, { Request, Response } from 'express';
import { ClauseTemplate, ClauseTemplateAttrs } from '../models/ClauseTemplate';

const router = express.Router();

// GET /clause?category=Legal&q=confidential&page=1&limit=50
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, q, page, limit } = req.query as Record<string, string | undefined>;

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (q && q.trim().length > 0) filter.$text = { $search: q.trim() };

    const pageNum = Math.max(1, Number(page ?? '1') || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit ?? '50') || 50));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      ClauseTemplate.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ClauseTemplate.countDocuments(filter),
    ]);

    res.status(200).json({ items, page: pageNum, limit: limitNum, total });
  } catch (error) {
    console.error('GET /clause error:', error);
    res.status(500).json({ error: 'Failed to fetch clause templates' });
  }
});

// GET /clause/:templateId
router.get('/:templateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const item = await ClauseTemplate.findOne({ templateId }).lean();

    if (!item) {
      res.status(404).json({ error: 'Clause template not found' });
      return;
    }

    res.status(200).json({ item });
  } catch (error) {
    console.error('GET /clause/:templateId error:', error);
    res.status(500).json({ error: 'Failed to fetch clause template' });
  }
});

// POST /clause
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Partial<ClauseTemplateAttrs>;

    if (!body.templateId || !body.name || !body.description || !body.content || !body.category) {
      res.status(400).json({ error: 'templateId, name, description, content, category are required' });
      return;
    }

    const created = await ClauseTemplate.create({
      templateId: body.templateId,
      name: body.name,
      description: body.description,
      content: body.content,
      category: body.category,
    });

    res.status(201).json({ item: created.toObject() });
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ error: 'templateId already exists' });
      return;
    }
    console.error('POST /clause error:', error);
    res.status(500).json({ error: 'Failed to create clause template' });
  }
});

// PUT /clause/:templateId
router.put('/:templateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const body = req.body as Partial<ClauseTemplateAttrs>;

    const updated = await ClauseTemplate.findOneAndUpdate(
      { templateId },
      {
        $set: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.content !== undefined ? { content: body.content } : {}),
          ...(body.category !== undefined ? { category: body.category } : {}),
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ error: 'Clause template not found' });
      return;
    }

    res.status(200).json({ item: updated });
  } catch (error) {
    console.error('PUT /clause/:templateId error:', error);
    res.status(500).json({ error: 'Failed to update clause template' });
  }
});

// DELETE /clause/:templateId
router.delete('/:templateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const deleted = await ClauseTemplate.findOneAndDelete({ templateId });

    if (!deleted) {
      res.status(404).json({ error: 'Clause template not found' });
      return;
    }

    res.status(200).json({ message: 'Clause template deleted' });
  } catch (error) {
    console.error('DELETE /clause/:templateId error:', error);
    res.status(500).json({ error: 'Failed to delete clause template' });
  }
});

export default router;
