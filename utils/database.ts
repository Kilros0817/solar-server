import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
  min: 2,
  query_timeout: 30000,
  statement_timeout: 30000,
  application_name: 'solar-server',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export { pool };
