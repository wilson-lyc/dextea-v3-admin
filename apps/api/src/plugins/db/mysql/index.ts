import { drizzle } from 'drizzle-orm/mysql2';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2';
import type { FastifyInstance } from 'fastify';
import { config } from '@/config';

declare module 'fastify' {
  interface FastifyInstance {
    db: MySql2Database<Record<string, unknown>>;
  }
}

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 10,
});

export const db = drizzle({ client: pool });

export async function registerDb(app: FastifyInstance) {
  app.decorate('db', db);

  app.addHook('onClose', async () => {
    await pool.end();
  });
}

/** @deprecated 旧路由使用，后续逐步迁移到 `db` */
export async function getDb() {
  return db;
}

export { drizzle };
