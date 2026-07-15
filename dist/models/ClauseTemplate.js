"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClauseTemplate = void 0;
const database_1 = require("../utils/database");
exports.ClauseTemplate = {
    async find(filter = {}) {
        let query = 'SELECT * FROM clause_templates WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        if (filter.category) {
            query += ` AND category = $${paramIndex++}`;
            params.push(filter.category);
        }
        if (filter.template_id) {
            const templateIdFilter = filter.template_id;
            if (templateIdFilter.$in && Array.isArray(templateIdFilter.$in)) {
                query += ` AND template_id = ANY($${paramIndex++})`;
                params.push(templateIdFilter.$in);
            }
        }
        if (filter.$text) {
            const searchText = filter.$text.$search;
            query += ` AND (name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++} OR content ILIKE $${paramIndex++})`;
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
            content: row.content,
            category: row.category,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },
    async findOne(filter) {
        if (filter.templateId) {
            const result = await database_1.pool.query('SELECT * FROM clause_templates WHERE template_id = $1', [filter.templateId]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                id: row.id,
                templateId: row.template_id,
                name: row.name,
                description: row.description,
                content: row.content,
                category: row.category,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        }
        return null;
    },
    async create(data) {
        const result = await database_1.pool.query('INSERT INTO clause_templates (template_id, name, description, content, category) VALUES ($1, $2, $3, $4, $5) RETURNING *', [data.templateId, data.name, data.description, data.content, data.category]);
        const row = result.rows[0];
        return {
            id: row.id,
            templateId: row.template_id,
            name: row.name,
            description: row.description,
            content: row.content,
            category: row.category,
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
            const result = await database_1.pool.query(`UPDATE clause_templates SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE template_id = $1 RETURNING *`, [filter.templateId, ...values]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                id: row.id,
                templateId: row.template_id,
                name: row.name,
                description: row.description,
                content: row.content,
                category: row.category,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        }
        return null;
    },
    async findOneAndDelete(filter) {
        if (filter.templateId) {
            const result = await database_1.pool.query('DELETE FROM clause_templates WHERE template_id = $1 RETURNING *', [filter.templateId]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                id: row.id,
                templateId: row.template_id,
                name: row.name,
                description: row.description,
                content: row.content,
                category: row.category,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            };
        }
        return null;
    },
    async countDocuments(filter = {}) {
        let query = 'SELECT COUNT(*) FROM clause_templates WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        if (filter.category) {
            query += ` AND category = $${paramIndex++}`;
            params.push(filter.category);
        }
        if (filter.$text) {
            const searchText = filter.$text.$search;
            query += ` AND (name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++} OR content ILIKE $${paramIndex++})`;
            const searchTerm = `%${searchText}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        const result = await database_1.pool.query(query, params);
        return parseInt(result.rows[0].count, 10);
    },
    async deleteMany(filter = {}) {
        const result = await database_1.pool.query('DELETE FROM clause_templates');
        return { deletedCount: result.rowCount || 0 };
    },
};
