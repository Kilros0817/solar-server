"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractTemplate = void 0;
const database_1 = require("../utils/database");
exports.ContractTemplate = {
    async find(filter = {}) {
        let query = 'SELECT * FROM contract_templates WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        if (filter.category) {
            query += ` AND category = $${paramIndex++}`;
            params.push(filter.category);
        }
        if (filter.$text) {
            const searchText = filter.$text.$search;
            query += ` AND (name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++} OR category ILIKE $${paramIndex++})`;
            const searchTerm = `%${searchText}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        query += ' ORDER BY name';
        const result = await database_1.pool.query(query, params);
        return result.rows.map((row) => ({
            id: row.id,
            templateId: row.template_id,
            name: row.name,
            description: row.description,
            category: row.category,
            createdBy: row.created_by,
            sectionIds: row.section_ids || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },
    async findOne(filter) {
        if (filter.templateId) {
            const result = await database_1.pool.query('SELECT * FROM contract_templates WHERE template_id = $1', [filter.templateId]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                id: row.id,
                templateId: row.template_id,
                name: row.name,
                description: row.description,
                category: row.category,
                createdBy: row.created_by,
                sectionIds: row.section_ids || [],
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        }
        return null;
    },
    async create(data) {
        const result = await database_1.pool.query('INSERT INTO contract_templates (template_id, name, description, category, created_by, section_ids) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [data.templateId, data.name, data.description, data.category, data.createdBy, data.sectionIds || []]);
        const row = result.rows[0];
        return {
            id: row.id,
            templateId: row.template_id,
            name: row.name,
            description: row.description,
            category: row.category,
            createdBy: row.created_by,
            sectionIds: row.section_ids || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    },
    async findOneAndUpdate(filter, update, options) {
        if (filter.templateId) {
            const setClause = Object.keys(update.$set || {})
                .map((key, i) => `${key} = $${i + 2}`)
                .join(', ');
            const values = Object.values(update.$set || {});
            const result = await database_1.pool.query(`UPDATE contract_templates SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE template_id = $1 RETURNING *`, [filter.templateId, ...values]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                id: row.id,
                templateId: row.template_id,
                name: row.name,
                description: row.description,
                category: row.category,
                createdBy: row.created_by,
                sectionIds: row.section_ids || [],
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        }
        return null;
    },
    async findOneAndDelete(filter) {
        if (filter.templateId) {
            const result = await database_1.pool.query('DELETE FROM contract_templates WHERE template_id = $1 RETURNING *', [filter.templateId]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                id: row.id,
                templateId: row.template_id,
                name: row.name,
                description: row.description,
                category: row.category,
                createdBy: row.created_by,
                sectionIds: row.section_ids || [],
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        }
        return null;
    },
    async countDocuments(filter = {}) {
        let query = 'SELECT COUNT(*) FROM contract_templates WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        if (filter.category) {
            query += ` AND category = $${paramIndex++}`;
            params.push(filter.category);
        }
        if (filter.$text) {
            const searchText = filter.$text.$search;
            query += ` AND (name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++} OR category ILIKE $${paramIndex++})`;
            const searchTerm = `%${searchText}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        const result = await database_1.pool.query(query, params);
        return parseInt(result.rows[0].count, 10);
    },
    async deleteMany(filter = {}) {
        const result = await database_1.pool.query('DELETE FROM contract_templates');
        return { deletedCount: result.rowCount || 0 };
    },
};
