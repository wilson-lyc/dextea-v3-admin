import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/plugins/db/mysql',
  schema: './src/plugins/db/mysql/schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    url:
      `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}` +
      `@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  },
});
