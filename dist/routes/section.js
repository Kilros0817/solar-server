"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const SectionTemplate_1 = require("../models/SectionTemplate");
const ClauseTemplate_1 = require("../models/ClauseTemplate");
const router = express_1.default.Router();
async function resolveContentFromClauses(clauseIds) {
    if (!clauseIds || clauseIds.length === 0)
        return '';
    const clauses = await ClauseTemplate_1.ClauseTemplate.find({ templateId: { $in: clauseIds } })
        .sort({ templateId: 1 })
        .lean();
    const orderMap = new Map(clauseIds.map((id, i) => [id, i]));
    clauses.sort((a, b) => (orderMap.get(a.templateId) ?? 0) - (orderMap.get(b.templateId) ?? 0));
    return clauses.map((c) => c.content).join('\n\n');
}
router.get('/', async (req, res) => {
    try {
        const { sectionName, category, q, page, limit } = req.query;
        const filter = {};
        if (sectionName)
            filter.sectionName = sectionName;
        if (category)
            filter.category = category;
        if (q && q.trim().length > 0)
            filter.$text = { $search: q.trim() };
        const pageNum = Math.max(1, Number(page ?? '1') || 1);
        const limitNum = Math.min(200, Math.max(1, Number(limit ?? '50') || 50));
        const skip = (pageNum - 1) * limitNum;
        const [rawItems, total] = await Promise.all([
            SectionTemplate_1.SectionTemplate.find(filter)
                .sort({ sectionName: 1, name: 1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            SectionTemplate_1.SectionTemplate.countDocuments(filter),
        ]);
        const items = await Promise.all(rawItems.map(async (item) => ({
            ...item,
            content: await resolveContentFromClauses(item.clauseIds ?? []),
        })));
        res.status(200).json({ items, page: pageNum, limit: limitNum, total });
    }
    catch (error) {
        console.error('GET /section error:', error);
        res.status(500).json({ error: 'Failed to fetch section templates' });
    }
});
router.get('/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;
        const item = await SectionTemplate_1.SectionTemplate.findOne({ templateId }).lean();
        if (!item) {
            res.status(404).json({ error: 'Section template not found' });
            return;
        }
        const content = await resolveContentFromClauses(item.clauseIds ?? []);
        res.status(200).json({ item: { ...item, content } });
    }
    catch (error) {
        console.error('GET /section/:templateId error:', error);
        res.status(500).json({ error: 'Failed to fetch section template' });
    }
});
router.post('/', async (req, res) => {
    try {
        const body = req.body;
        if (!body.templateId || !body.sectionName || !body.name || !body.description || !body.category) {
            res.status(400).json({
                error: 'templateId, sectionName, name, description, category are required',
            });
            return;
        }
        const created = await SectionTemplate_1.SectionTemplate.create({
            templateId: body.templateId,
            sectionName: body.sectionName,
            name: body.name,
            description: body.description,
            category: body.category,
            clauseIds: body.clauseIds ?? [],
        });
        const item = created.toObject();
        const content = await resolveContentFromClauses(item.clauseIds ?? []);
        res.status(201).json({ item: { ...item, content } });
    }
    catch (error) {
        if (error?.code === 11000) {
            res.status(409).json({ error: 'templateId already exists' });
            return;
        }
        console.error('POST /section error:', error);
        res.status(500).json({ error: 'Failed to create section template' });
    }
});
router.put('/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;
        const body = req.body;
        const update = {};
        if (body.sectionName !== undefined)
            update.sectionName = body.sectionName;
        if (body.name !== undefined)
            update.name = body.name;
        if (body.description !== undefined)
            update.description = body.description;
        if (body.category !== undefined)
            update.category = body.category;
        if (body.clauseIds !== undefined)
            update.clauseIds = body.clauseIds;
        const updated = await SectionTemplate_1.SectionTemplate.findOneAndUpdate({ templateId }, { $set: update }, { new: true }).lean();
        if (!updated) {
            res.status(404).json({ error: 'Section template not found' });
            return;
        }
        const content = await resolveContentFromClauses(updated.clauseIds ?? []);
        res.status(200).json({ item: { ...updated, content } });
    }
    catch (error) {
        console.error('PUT /section/:templateId error:', error);
        res.status(500).json({ error: 'Failed to update section template' });
    }
});
router.delete('/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;
        const deleted = await SectionTemplate_1.SectionTemplate.findOneAndDelete({ templateId });
        if (!deleted) {
            res.status(404).json({ error: 'Section template not found' });
            return;
        }
        res.status(200).json({ message: 'Section template deleted' });
    }
    catch (error) {
        console.error('DELETE /section/:templateId error:', error);
        res.status(500).json({ error: 'Failed to delete section template' });
    }
});
exports.default = router;
