import express, { Request, Response } from 'express';
import { createClient } from 'redis';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { pool } from '../utils/database';

dotenv.config();

const REDIS_URL = `redis://localhost:6379`;
const CACHE_TTL_SECONDS = parseInt(String(process.env.CACHE_TTL || '60'), 10);

const router = express.Router();

let redisClient: ReturnType<typeof createClient> | null = null;

export const getRedisClient = async () => {
  if (redisClient && redisClient.isOpen) return redisClient;

  if (redisClient && !redisClient.isOpen) {
    try {
      await redisClient.quit();
    } catch (e) {
      // Ignore quit errors
    }
    redisClient = null;
  }

  redisClient = createClient({ url: REDIS_URL });
  redisClient.on('error', (err) => console.error('Redis error:', err));
  await redisClient.connect();
  return redisClient;
};

const getCacheKey = (key: string) => {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  return `postgres:${hash}`;
};

/**
 * Query PostgreSQL with Redis caching
 */
export const queryPostgres = async (sql: string, params: unknown[] = [], bypassCache = false): Promise<unknown> => {
  const cacheKey = getCacheKey(`${sql}:${JSON.stringify(params)}`);

  if (!bypassCache) {
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (redisErr) {
      console.warn('Redis cache read failed, querying PostgreSQL directly:', redisErr);
    }
  }

  const result = await pool.query(sql, params);
  const data = result.rows;

  try {
    const redis = await getRedisClient();
    await redis.setEx(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(data));
  } catch (redisErr) {
    console.warn('Redis cache write failed:', redisErr);
  }

  return data;
};

// GET /postgres/documents - Get all documents
router.get('/documents', async (req: Request, res: Response): Promise<void> => {
  try {
    const { client, status, category, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (client) {
      sql += ` AND client = $${paramIndex++}`;
      params.push(String(client).toLowerCase());
    }
    if (status !== undefined) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(Number(status));
    }
    if (category) {
      sql += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    const [data, countResult] = await Promise.all([
      pool.query(sql + ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limitNum, offset]),
      pool.query(sql.replace('SELECT *', 'SELECT COUNT(*)'), params)
    ]);

    const total = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count as string) : 0;

    res.json({ isSuccess: true, data: data.rows, page: pageNum, limit: limitNum, total });
  } catch (error) {
    console.error('GET /postgres/documents error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/documents/:id - Get single document
router.get('/documents/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ isSuccess: false, error: 'Document not found' });
      return;
    }

    res.json({ isSuccess: true, data: result.rows[0] });
  } catch (error) {
    console.error('GET /postgres/documents/:id error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/sections - Get all sections
router.get('/sections', async (req: Request, res: Response): Promise<void> => {
  try {
    const { docId, status, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    let sql = 'SELECT * FROM sections WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (docId) {
      sql += ` AND doc_id = $${paramIndex++}`;
      params.push(docId);
    }
    if (status !== undefined) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(Number(status));
    }

    const [data, countResult] = await Promise.all([
      pool.query(sql + ` ORDER BY assigned_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limitNum, offset]),
      pool.query(sql.replace('SELECT *', 'SELECT COUNT(*)'), params)
    ]);

    const total = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count as string) : 0;

    res.json({ isSuccess: true, data: data.rows, page: pageNum, limit: limitNum, total });
  } catch (error) {
    console.error('GET /postgres/sections error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/sections/:id - Get single section
router.get('/sections/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM sections WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ isSuccess: false, error: 'Section not found' });
      return;
    }

    res.json({ isSuccess: true, data: result.rows[0] });
  } catch (error) {
    console.error('GET /postgres/sections/:id error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/clauses - Get all clauses
router.get('/clauses', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sectionId, status, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    let sql = 'SELECT * FROM clauses WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (sectionId) {
      sql += ` AND section_id = $${paramIndex++}`;
      params.push(sectionId);
    }
    if (status !== undefined) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(Number(status));
    }

    const [data, countResult] = await Promise.all([
      pool.query(sql + ` ORDER BY assigned_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limitNum, offset]),
      pool.query(sql.replace('SELECT *', 'SELECT COUNT(*)'), params)
    ]);

    const total = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count as string) : 0;

    res.json({ isSuccess: true, data: data.rows, page: pageNum, limit: limitNum, total });
  } catch (error) {
    console.error('GET /postgres/clauses error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/clauses/:id - Get single clause
router.get('/clauses/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM clauses WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ isSuccess: false, error: 'Clause not found' });
      return;
    }

    res.json({ isSuccess: true, data: result.rows[0] });
  } catch (error) {
    console.error('GET /postgres/clauses/:id error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/doc-histories - Get document histories
router.get('/doc-histories', async (req: Request, res: Response): Promise<void> => {
  try {
    const { docId, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    let sql = 'SELECT * FROM doc_histories WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (docId) {
      sql += ` AND doc_id = $${paramIndex++}`;
      params.push(docId);
    }

    const [data, countResult] = await Promise.all([
      pool.query(sql + ` ORDER BY date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limitNum, offset]),
      pool.query(sql.replace('SELECT *', 'SELECT COUNT(*)'), params)
    ]);

    const total = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count as string) : 0;

    res.json({ isSuccess: true, data: data.rows, page: pageNum, limit: limitNum, total });
  } catch (error) {
    console.error('GET /postgres/doc-histories error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/section-histories - Get section histories
router.get('/section-histories', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sectionId, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    let sql = 'SELECT * FROM section_histories WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (sectionId) {
      sql += ` AND section_id = $${paramIndex++}`;
      params.push(sectionId);
    }

    const [data, countResult] = await Promise.all([
      pool.query(sql + ` ORDER BY date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limitNum, offset]),
      pool.query(sql.replace('SELECT *', 'SELECT COUNT(*)'), params)
    ]);

    const total = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count as string) : 0;

    res.json({ isSuccess: true, data: data.rows, page: pageNum, limit: limitNum, total });
  } catch (error) {
    console.error('GET /postgres/section-histories error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/clause-histories - Get clause histories
router.get('/clause-histories', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clauseId, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    let sql = 'SELECT * FROM clause_histories WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (clauseId) {
      sql += ` AND clause_id = $${paramIndex++}`;
      params.push(clauseId);
    }

    const [data, countResult] = await Promise.all([
      pool.query(sql + ` ORDER BY date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limitNum, offset]),
      pool.query(sql.replace('SELECT *', 'SELECT COUNT(*)'), params)
    ]);

    const total = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count as string) : 0;

    res.json({ isSuccess: true, data: data.rows, page: pageNum, limit: limitNum, total });
  } catch (error) {
    console.error('GET /postgres/clause-histories error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/users/:address - Get user by address
router.get('/users/:address', async (req: Request, res: Response): Promise<void> => {
  try {
    const { address } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE address = $1', [address.toLocaleLowerCase()]);
    if (result.rows.length === 0) {
      res.status(404).json({ isSuccess: false, error: 'User not found' });
      return;
    }

    const user = result.rows[0];
    res.json({
      isSuccess: true, data: {
        id: user.address,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        dcategory: user.dcategory,
        onPending: user.on_pending
      }
    });
  } catch (error) {
    console.error('GET /postgres/users/:address error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/users - Get users with filters
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, dcategory, onPending, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    let sql = 'SELECT * FROM users WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (role !== undefined) {
      sql += ` AND role = $${paramIndex++}`;
      params.push(Number(role));
    }
    if (dcategory !== undefined) {
      sql += ` AND dcategory = $${paramIndex++}`;
      params.push(Number(dcategory));
    }
    if (onPending !== undefined) {
      sql += ` AND on_pending = $${paramIndex++}`;
      params.push(onPending === 'true');
    }

    const [data, countResult] = await Promise.all([
      pool.query(sql + ` ORDER BY id LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limitNum, offset]),
      pool.query(sql.replace('SELECT *', 'SELECT COUNT(*)'), params)
    ]);

    const total = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count as string) : 0;
    const users = data.rows.map((user: any) => ({
      id: user.address,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      dcategory: user.dcategory,
      onPending: user.on_pending
    }));

    res.json({ isSuccess: true, data: users, page: pageNum, limit: limitNum, total });
  } catch (error) {
    console.error('GET /postgres/users error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/documents-full - Get documents with nested relations
router.get('/documents-full', async (req: Request, res: Response): Promise<void> => {
  try {
    const { client, status, category, page = '1', limit = '50' } = req.query;
    
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    let sql = `SELECT d.*,
      u.address as client_id, u.first_name as client_first_name, u.last_name as client_last_name, u.email as client_email,
      (SELECT COUNT(*) FROM sections s WHERE s.doc_id = d.id) as section_count
      FROM documents d
      LEFT JOIN users u ON d.client = u.address
      WHERE 1=1`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (client) {
      sql += ` AND d.client = $${paramIndex++}`;
      params.push(client);
    }
    if (status !== undefined) {
      sql += ` AND d.status = $${paramIndex++}`;
      params.push(Number(status));
    }
    if (category) {
      sql += ` AND d.category = $${paramIndex++}`;
      params.push(category);
    }

    const [data, countResult] = await Promise.all([
      pool.query(sql + ` ORDER BY CAST(d.id AS INTEGER) ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limitNum, offset]),
      pool.query(sql.replace(/SELECT d\.*,[\s\S]*?FROM/, 'SELECT COUNT(*) FROM'), params)
    ]);

    const total = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count as string) : 0;
    const documents = data.rows.map((doc: any) => ({
      id: doc.id,
      client: doc.client_id ? {
        id: doc.client_id,
        firstName: doc.client_first_name,
        lastName: doc.client_last_name,
        email: doc.client_email
      } : null,
      category: doc.category,
      title: doc.title,
      cid: doc.cid,
      status: doc.status,
      reject_reason: doc.reject_reason,
      created_at: doc.created_at,
      section_count: doc.section_count || 0
    }));

    res.json({ isSuccess: true, data: documents, page: pageNum, limit: limitNum, total });
  } catch (error) {
    console.error('GET /postgres/documents-full error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/documents-full/:id - Get single document with nested relations
router.get('/documents-full/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const docResult = await pool.query(
      `SELECT d.*,
        u.address as client_id, u.first_name as client_first_name, u.last_name as client_last_name, u.email as client_email
      FROM documents d
      LEFT JOIN users u ON d.client = u.address
      WHERE d.id = $1`,
      [id]
    );

    if (docResult.rows.length === 0) {
      res.status(404).json({ isSuccess: false, error: 'Document not found' });
      return;
    }

    const doc = docResult.rows[0];

    // Get sections for this document
    const sectionsResult = await pool.query(
      `SELECT s.*, 
        u.address as division_leader_id, u.first_name as division_leader_first_name, u.last_name as division_leader_last_name, u.dcategory as division_leader_dcategory
      FROM sections s 
      LEFT JOIN users u ON s.division_leader = u.address 
      WHERE s.doc_id = $1`,
      [id]
    );

    const sections = await Promise.all(sectionsResult.rows.map(async (section: any) => {
      // Get clauses for this section
      const clausesResult = await pool.query(
        `SELECT c.*, 
          u.address as division_member_id, u.first_name as division_member_first_name, u.last_name as division_member_last_name, u.email as division_member_email
        FROM clauses c 
        LEFT JOIN users u ON c.division_member = u.address 
        WHERE c.section_id = $1
        ORDER BY CAST(c.id AS INTEGER) ASC`,
        [section.id]
      );

      return {
        id: section.id,
        cid: section.cid,
        assigned_at: section.assigned_at,
        status: section.status,
        reject_reason: section.reject_reason,
        division_leader: section.division_leader_id ? {
          id: section.division_leader_id,
          firstName: section.division_leader_first_name,
          lastName: section.division_leader_last_name,
          dcategory: section.division_leader_dcategory
        } : null,
        clauses: clausesResult.rows.map((clause: any) => ({
          id: clause.id,
          cid: clause.cid,
          assigned_at: clause.assigned_at,
          status: clause.status,
          reject_reason: clause.reject_reason,
          division_member: clause.division_member_id ? {
            id: clause.division_member_id,
            firstName: clause.division_member_first_name,
            lastName: clause.division_member_last_name,
            email: clause.division_member_email
          } : null
        }))
      };
    }));

    // Get esigns
    const clientEsign = doc.client_esign_id ? await pool.query('SELECT * FROM esigns WHERE subgraph_id = $1', [doc.client_esign_id]) : null;
    const legalEsign = doc.legal_esign_id ? await pool.query('SELECT * FROM esigns WHERE subgraph_id = $1', [doc.legal_esign_id]) : null;

    res.json({
      isSuccess: true, data: {
        id: doc.id,
        client: doc.client_id ? {
          id: doc.client_id,
          firstName: doc.client_first_name,
          lastName: doc.client_last_name,
          email: doc.client_email
        } : null,
        category: doc.category,
        title: doc.title,
        cid: doc.cid,
        status: doc.status,
        reject_reason: doc.reject_reason,
        created_at: doc.created_at,
        sections,
        client_e_sign: clientEsign?.rows[0] || null,
        legal_e_sign: legalEsign?.rows[0] || null
      }
    });
  } catch (error) {
    console.error('GET /postgres/documents-full/:id error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/sections-full - Get sections with nested relations
router.get('/sections-full', async (req: Request, res: Response): Promise<void> => {
  try {
    const { docId, divisionLeader, status, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    let sql = `SELECT s.*, 
      d.id as doc_id, d.title as doc_title, d.category as doc_category, d.status as doc_status, d.created_at as doc_created_at,
      u.address as client_id, u.first_name as client_first_name, u.last_name as client_last_name,
      ul.address as division_leader_id, ul.first_name as division_leader_first_name, ul.last_name as division_leader_last_name, ul.dcategory as division_leader_dcategory
      FROM sections s 
      LEFT JOIN documents d ON s.doc_id = d.id
      LEFT JOIN users u ON d.client = u.address
      LEFT JOIN users ul ON s.division_leader = ul.address
      WHERE 1=1`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (docId) {
      sql += ` AND s.doc_id = $${paramIndex++}`;
      params.push(docId);
    }
    if (divisionLeader) {
      sql += ` AND s.division_leader = $${paramIndex++}`;
      params.push(String(divisionLeader).toLowerCase());
    }
    if (status !== undefined) {
      sql += ` AND s.status = $${paramIndex++}`;
      params.push(Number(status));
    }

    const [data, countResult] = await Promise.all([
      pool.query(sql + ` ORDER BY CAST(s.id AS INTEGER) ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limitNum, offset]),
      pool.query(sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM'), params)
    ]);

    const total = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count as string) : 0;

    const sections = await Promise.all(data.rows.map(async (section: any) => {

      const clausesResult = await pool.query(
        `SELECT c.*, 
          u.address as division_member_id, u.first_name as division_member_first_name, u.last_name as division_member_last_name, u.email as division_member_email
        FROM clauses c 
        LEFT JOIN users u ON c.division_member = u.address 
        WHERE c.section_id = $1
        ORDER BY CAST(c.id AS INTEGER) ASC`,
        [section.id]
      );

      const clauses = clausesResult.rows.map((clause: any) => ({
        id: clause.id,
        cid: clause.cid,
        assigned_at: clause.assigned_at,
        status: clause.status,
        reject_reason: clause.reject_reason,
        division_member: clause.division_member_id ? {
          id: clause.division_member_id,
          firstName: clause.division_member_first_name,
          lastName: clause.division_member_last_name,
          email: clause.division_member_email
        } : null
      }));

      return {
        id: section.id,
        cid: section.cid,
        assigned_at: section.assigned_at,
        status: section.status,
        reject_reason: section.reject_reason,
        division_leader: section.division_leader_id ? {
          id: section.division_leader_id,
          firstName: section.division_leader_first_name,
          lastName: section.division_leader_last_name,
          dcategory: section.division_leader_dcategory
        } : null,
        doc: section.doc_id ? {
          id: section.doc_id,
          title: section.doc_title,
          category: section.doc_category,
          status: section.doc_status,
          created_at: section.doc_created_at,
          client: section.client_id ? {
            firstName: section.client_first_name,
            lastName: section.client_last_name
          } : null
        } : null,
        clauses: clauses
      };
    }));

    res.json({ isSuccess: true, data: sections, page: pageNum, limit: limitNum, total });
  } catch (error) {
    console.error('GET /postgres/sections-full error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

// GET /postgres/clauses-full - Get clauses with nested relations
router.get('/clauses-full', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sectionId, divisionMember, status, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(200, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    let sql = `SELECT c.*, 
      s.id as section_id, s.cid as section_cid, s.status as section_status,
      d.id as doc_id, d.title as doc_title, d.status as doc_status, d.created_at as doc_created_at, d.category as doc_category,
      u.address as client_id, u.first_name as client_first_name, u.last_name as client_last_name,
      um.address as division_member_id, um.first_name as division_member_first_name, um.last_name as division_member_last_name
      FROM clauses c 
      LEFT JOIN sections s ON c.section_id = s.id
      LEFT JOIN documents d ON s.doc_id = d.id
      LEFT JOIN users u ON d.client = u.address
      LEFT JOIN users um ON c.division_member = um.address
      WHERE 1=1`;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (sectionId) {
      sql += ` AND c.section_id = $${paramIndex++}`;
      params.push(sectionId);
    }
    if (divisionMember) {
      sql += ` AND c.division_member = $${paramIndex++}`;
      params.push(String(divisionMember).toLowerCase());
    }
    if (status !== undefined) {
      sql += ` AND c.status = $${paramIndex++}`;
      params.push(Number(status));
    }

    const [data, countResult] = await Promise.all([
      pool.query(sql + ` ORDER BY CAST(c.id AS INTEGER) ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limitNum, offset]),
      pool.query(sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM'), params)
    ]);

    const total = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count as string) : 0;
    const clauses = data.rows.map((clause: any) => ({
      id: clause.id,
      cid: clause.cid,
      assigned_at: clause.assigned_at,
      status: clause.status,
      reject_reason: clause.reject_reason,
      section: clause.section_id ? {
        id: clause.section_id,
        cid: clause.section_cid,
        status: clause.section_status
      } : null,
      doc: clause.doc_id ? {
        id: clause.doc_id,
        title: clause.doc_title,
        status: clause.doc_status,
        created_at: clause.doc_created_at,
        category: clause.doc_category,
        client: clause.client_id ? {
          firstName: clause.client_first_name,
          lastName: clause.client_last_name
        } : null
      } : null,
      division_member: clause.division_member_id ? {
        id: clause.division_member_id,
        firstName: clause.division_member_first_name,
        lastName: clause.division_member_last_name
      } : null
    }));

    res.json({ isSuccess: true, data: clauses, page: pageNum, limit: limitNum, total });
  } catch (error) {
    console.error('GET /postgres/clauses-full error:', error);
    res.status(500).json({ isSuccess: false, error: String(error) });
  }
});

export default router;
