"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ContractTemplate_1 = require("../models/ContractTemplate");
const router = express_1.default.Router();
function toApiItem(doc) {
    const createdAt = doc.createdAt;
    const updatedAt = doc.updatedAt;
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
router.get('/', async (req, res) => {
    try {
        const { category, q, page, limit } = req.query;
        const filter = {};
        if (category)
            filter.category = category;
        if (q && q.trim().length > 0)
            filter.$text = { $search: q.trim() };
        const pageNum = Math.max(1, Number(page ?? '1') || 1);
        const limitNum = Math.min(200, Math.max(1, Number(limit ?? '50') || 50));
        const skip = (pageNum - 1) * limitNum;
        const [rawItems, total] = await Promise.all([
            ContractTemplate_1.ContractTemplate.find(filter)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            ContractTemplate_1.ContractTemplate.countDocuments(filter),
        ]);
        const items = rawItems.map((item) => toApiItem(item));
        res.status(200).json({ items, page: pageNum, limit: limitNum, total });
    }
    catch (error) {
        console.error('GET /contract error:', error);
        res.status(500).json({ error: 'Failed to fetch contract templates' });
    }
});
router.get('/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;
        const item = await ContractTemplate_1.ContractTemplate.findOne({ templateId }).lean();
        if (!item) {
            res.status(404).json({ error: 'Contract template not found' });
            return;
        }
        res.status(200).json({ item: toApiItem(item) });
    }
    catch (error) {
        console.error('GET /contract/:templateId error:', error);
        res.status(500).json({ error: 'Failed to fetch contract template' });
    }
});
router.post('/', async (req, res) => {
    try {
        const body = req.body;
        if (!body.templateId || !body.name || !body.description || !body.category || body.createdBy === undefined) {
            res.status(400).json({
                error: 'templateId, name, description, category, createdBy are required',
            });
            return;
        }
        const created = await ContractTemplate_1.ContractTemplate.create({
            templateId: body.templateId,
            name: body.name,
            description: body.description,
            category: body.category,
            createdBy: body.createdBy,
            sectionIds: body.sectionIds ?? [],
        });
        res.status(201).json({ item: toApiItem(created.toObject()) });
    }
    catch (error) {
        const err = error;
        if (err?.code === 11000) {
            res.status(409).json({ error: 'templateId already exists' });
            return;
        }
        console.error('POST /contract error:', error);
        res.status(500).json({ error: 'Failed to create contract template' });
    }
});
router.put('/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;
        const body = req.body;
        const update = {};
        if (body.name !== undefined)
            update.name = body.name;
        if (body.description !== undefined)
            update.description = body.description;
        if (body.category !== undefined)
            update.category = body.category;
        if (body.createdBy !== undefined)
            update.createdBy = body.createdBy;
        if (body.sectionIds !== undefined)
            update.sectionIds = body.sectionIds;
        const updated = await ContractTemplate_1.ContractTemplate.findOneAndUpdate({ templateId }, { $set: update }, { new: true }).lean();
        if (!updated) {
            res.status(404).json({ error: 'Contract template not found' });
            return;
        }
        res.status(200).json({ item: toApiItem(updated) });
    }
    catch (error) {
        console.error('PUT /contract/:templateId error:', error);
        res.status(500).json({ error: 'Failed to update contract template' });
    }
});
router.delete('/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;
        const deleted = await ContractTemplate_1.ContractTemplate.findOneAndDelete({ templateId });
        if (!deleted) {
            res.status(404).json({ error: 'Contract template not found' });
            return;
        }
        res.status(200).json({ message: 'Contract template deleted' });
    }
    catch (error) {
        console.error('DELETE /contract/:templateId error:', error);
        res.status(500).json({ error: 'Failed to delete contract template' });
    }
});
exports.default = router;
