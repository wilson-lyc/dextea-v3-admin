import { eq } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { employeesTable } from '@/plugins/db/mysql/schema.js';

export const authRepository = {
  async getEmployeeByEmail(email: string) {
    const rows = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.email, email))
      .limit(1);
    return rows[0] ?? null;
  },

  async getEmployeeById(id: number) {
    const rows = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async updatePassword(id: number, hashedPassword: string) {
    await db
      .update(employeesTable)
      .set({ password: hashedPassword })
      .where(eq(employeesTable.id, id));
  },
};
