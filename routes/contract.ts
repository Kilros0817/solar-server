import express, { Request, Response } from 'express';
import { ContractTemplate, ContractTemplateAttrs } from '../models/ContractTemplate';

const router = express.Router();

function toApiItem(doc: Record<string, unknown>): Record<string, unknown> {
  const createdAt = doc.createdAt as Date | undefined;
  const updatedAt = doc.updatedAt as Date | undefined;
  return {
    id: doc.templateId,
    templateId: doc.templateId,
    name: doc.name,
    description: doc.description,
    category: doc.category,
    createdBy: doc.createdBy,
    sectionIds: doc.sectionIds ?? [],
    createdDate: createdAt ? createdAt.toISOString() : new Date().toISOString(),
    lastModified: updatedAt ? updatedAt.toISOString() : new Date().toISOString(),
  };
}

// GET /contract?category=Services&q=agreement&page=1&limit=50
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, q, page, limit } = req.query as Record<string, string | undefined>;

    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (q && q.trim().length > 0) filter.$text = { $search: q.trim() };

    const pageNum = Math.max(1, Number(page ?? '1') || 1);
    const limitNum = Math.min(200, Math.max(1, Number(limit ?? '50') || 50));
    const skip = (pageNum - 1) * limitNum;

    const [rawItems, total] = await Promise.all([
      ContractTemplate.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ContractTemplate.countDocuments(filter),
    ]);

    const items = rawItems.map((item) => toApiItem(item as unknown as Record<string, unknown>));
    res.status(200).json({ items, page: pageNum, limit: limitNum, total });
  } catch (error) {
    console.error('GET /contract error:', error);
    res.status(500).json({ error: 'Failed to fetch contract templates' });
  }
});

// GET /contract/:templateId
router.get('/:templateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const item = await ContractTemplate.findOne({ templateId }).lean();

    if (!item) {
      res.status(404).json({ error: 'Contract template not found' });
      return;
    }

    res.status(200).json({ item: toApiItem(item as unknown as Record<string, unknown>) });
  } catch (error) {
    console.error('GET /contract/:templateId error:', error);
    res.status(500).json({ error: 'Failed to fetch contract template' });
  }
});

// POST /contract
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Partial<ContractTemplateAttrs>;

    if (!body.templateId || !body.name || !body.description || !body.category || body.createdBy === undefined) {
      res.status(400).json({
        error: 'templateId, name, description, category, createdBy are required',
      });
      return;
    }

    const created = await ContractTemplate.create({
      templateId: body.templateId,
      name: body.name,
      description: body.description,
      category: body.category,
      createdBy: body.createdBy,
      sectionIds: body.sectionIds ?? [],
    });

    res.status(201).json({ item: toApiItem(created.toObject() as unknown as Record<string, unknown>) });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err?.code === 11000) {
      res.status(409).json({ error: 'templateId already exists' });
      return;
    }
    console.error('POST /contract error:', error);
    res.status(500).json({ error: 'Failed to create contract template' });
  }
});

// PUT /contract/:templateId
router.put('/:templateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const body = req.body as Partial<ContractTemplateAttrs>;

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.description !== undefined) update.description = body.description;
    if (body.category !== undefined) update.category = body.category;
    if (body.createdBy !== undefined) update.createdBy = body.createdBy;
    if (body.sectionIds !== undefined) update.sectionIds = body.sectionIds;

    const updated = await ContractTemplate.findOneAndUpdate(
      { templateId },
      { $set: update },
      { new: true }
    ).lean();

    if (!updated) {
      res.status(404).json({ error: 'Contract template not found' });
      return;
    }

    res.status(200).json({ item: toApiItem(updated as unknown as Record<string, unknown>) });
  } catch (error) {
    console.error('PUT /contract/:templateId error:', error);
    res.status(500).json({ error: 'Failed to update contract template' });
  }
});

// DELETE /contract/:templateId
router.delete('/:templateId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const deleted = await ContractTemplate.findOneAndDelete({ templateId });

    if (!deleted) {
      res.status(404).json({ error: 'Contract template not found' });
      return;
    }

    res.status(200).json({ message: 'Contract template deleted' });
  } catch (error) {
    console.error('DELETE /contract/:templateId error:', error);
    res.status(500).json({ error: 'Failed to delete contract template' });
  }
});

export default router;
