import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2';
import { config } from '../../../config/index.js';

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

/** @deprecated 旧路由使用，后续逐步迁移到 `db` */
export async function getDb() {
  return db;
}

export { drizzle };
