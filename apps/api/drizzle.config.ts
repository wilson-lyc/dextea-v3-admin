import { defineConfig } from 'drizzle-kit';
import { config } from './src/config.js';

const { db } = config;

export default defineConfig({
  out: './src/plugins/db/mysql',
  schema: './src/plugins/db/mysql/schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    url: `mysql://${db.user}:${db.password}@${db.host}:${db.port}/${db.name}`,
  },
});
