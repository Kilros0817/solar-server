import { pool } from '../utils/database';

export interface ClauseTemplateAttrs {
  templateId: string; // e.g. "c1"
  name: string;
  description: string;
  content: string;
  category: string;
}

export interface ClauseTemplateDoc extends ClauseTemplateAttrs {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ClauseTemplate = {
  async find(filter: Record<string, unknown> = {}): Promise<ClauseTemplateDoc[]> {
    let query = 'SELECT * FROM clause_templates WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter.category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(filter.category);
    }

    if (filter.$text) {
      const searchText = (filter.$text as { $search: string }).$search;
      query += ` AND (name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++} OR content ILIKE $${paramIndex++})`;
      const searchTerm = `%${searchText}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    return result.rows.map((row: any) => ({
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

  async findOne(filter: Record<string, unknown>): Promise<ClauseTemplateDoc | null> {
    if (filter.templateId) {
      const result = await pool.query('SELECT * FROM clause_templates WHERE template_id = $1', [filter.templateId]);
      if (result.rows.length === 0) return null;
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

  async create(data: ClauseTemplateAttrs): Promise<ClauseTemplateDoc> {
    const result = await pool.query(
      'INSERT INTO clause_templates (template_id, name, description, content, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [data.templateId, data.name, data.description, data.content, data.category]
    );
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

  async findOneAndUpdate(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    options: { new?: boolean }
  ): Promise<ClauseTemplateDoc | null> {
    if (filter.templateId) {
      const setClause = Object.keys(update.$set || {})
        .map((key, i) => `${key} = $${i + 2}`)
        .join(', ');
      const values = Object.values(update.$set || {});
      const result = await pool.query(
        `UPDATE clause_templates SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE template_id = $1 RETURNING *`,
        [filter.templateId, ...values]
      );
      if (result.rows.length === 0) return null;
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

  async findOneAndDelete(filter: Record<string, unknown>): Promise<ClauseTemplateDoc | null> {
    if (filter.templateId) {
      const result = await pool.query('DELETE FROM clause_templates WHERE template_id = $1 RETURNING *', [filter.templateId]);
      if (result.rows.length === 0) return null;
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

  async countDocuments(filter: Record<string, unknown> = {}): Promise<number> {
    let query = 'SELECT COUNT(*) FROM clause_templates WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter.category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(filter.category);
    }

    if (filter.$text) {
      const searchText = (filter.$text as { $search: string }).$search;
      query += ` AND (name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++} OR content ILIKE $${paramIndex++})`;
      const searchTerm = `%${searchText}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count as string, 10);
  },

  async deleteMany(filter: Record<string, unknown> = {}): Promise<{ deletedCount: number }> {
    const result = await pool.query('DELETE FROM clause_templates');
    return { deletedCount: result.rowCount || 0 };
  },
};
