import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2';
import { config } from '../config/index.js';

let db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (db) return db;

  const pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    waitForConnections: true,
    connectionLimit: 10,
  });

  db = drizzle({ client: pool });
  return db;
}

export { drizzle };
