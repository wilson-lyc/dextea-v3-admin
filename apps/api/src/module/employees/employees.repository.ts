import { eq, sql } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { employeesTable } from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/plugins/utils/pagination.js';

export const employeeRepository = {
  async getEmployeeListWithPage(page: number, pageSize: number, keyword?: string) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));
    keyword = keyword?.trim();

    const baseQuery = db
      .select({
        id: employeesTable.id,
        email: employeesTable.email,
        displayName: employeesTable.displayName,
        status: employeesTable.status,
        createdAt: employeesTable.createdAt,
        updatedAt: employeesTable.updatedAt,
      })
      .from(employeesTable)
      .orderBy(employeesTable.id)
      .$dynamic();

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(employeesTable);

    if (keyword) {
      const pattern = `%${keyword}%`;
      const filter = sql`(${employeesTable.email} like ${pattern} or ${employeesTable.displayName} like ${pattern})`;
      baseQuery.where(filter);
      countQuery.where(filter);
    }

    const [items, countResult] = await Promise.all([
      withPagination(baseQuery, page, pageSize),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },

  async getEmployeeById(id: number) {
    const rows = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.id, id))
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

  async createEmployee(data: { email: string; password: string; displayName: string; status: number }) {
    const result = await db.insert(employeesTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async updateEmployeeById(id: number, email: string, displayName: string) {
    await db
      .update(employeesTable)
      .set({ email, displayName })
      .where(eq(employeesTable.id, id));
  },

  async updateEmployeeStatusById(id: number, status: number) {
    await db
      .update(employeesTable)
      .set({ status })
      .where(eq(employeesTable.id, id));
  },
};
