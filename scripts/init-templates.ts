/**
 * Initialize template tables in PostgreSQL
 * Run from project root: npx ts-node scripts/init-templates.ts
 */
import dotenv from 'dotenv';
import { pool } from '../utils/database';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function initTemplateTables(): Promise<void> {
  try {
    console.log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('Executing schema...');
    await pool.query(schema);
    console.log('Template tables initialized successfully');
  } catch (error) {
    console.error('Failed to initialize template tables:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

initTemplateTables();
