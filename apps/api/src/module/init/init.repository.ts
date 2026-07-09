import { eq } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { configTable, employeesTable } from '@/plugins/db/mysql/schema.js';

export const initRepository = {
  async getInitStatus() {
    const rows = await db
      .select()
      .from(configTable)
      .where(eq(configTable.key, 'Initialized'))
      .limit(1);
    return rows[0] ?? null;
  },

  async getEmployeeByEmail(email: string) {
    const rows = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.email, email))
      .limit(1);
    return rows[0] ?? null;
  },

  async createAdmin(data: { email: string; password: string; displayName: string; status: number }) {
    const result = await db.insert(employeesTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async writeInitFlag() {
    await db.insert(configTable).values({
      key: 'Initialized',
      value: 'true',
      note: '系统初始化标记',
    });
  },
};
