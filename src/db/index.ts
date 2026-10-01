import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const isPostgresConfigured = (): boolean => {
  const host = process.env.SQL_HOST || '';
  if (!host || host === 'localhost' || host.includes('127.0.0.1')) {
    // If running in cloud/Vercel without an external SQL host, fallback gracefully
    if (process.env.VERCEL) return false;
  }
  return Boolean(process.env.SQL_HOST && process.env.SQL_PASSWORD);
};

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST || 'localhost',
      user: process.env.SQL_USER || 'postgres',
      password: process.env.SQL_PASSWORD || '',
      database: process.env.SQL_DB_NAME || 'hotel_db',
      max: 5,
      connectionTimeoutMillis: 1500,
      idleTimeoutMillis: 10000,
    });

    global._postgresPool.on('error', (err) => {
      console.warn('Postgres connection pool notice:', err.message);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
