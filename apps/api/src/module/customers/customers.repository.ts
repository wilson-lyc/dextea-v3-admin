import { and, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { customersTable } from '@/plugins/db/mysql/schema.js';
import { withPagination } from '@/utils';

export interface CustomerListFilters {
  id?: number;
  status?: number;
  name?: string;
  email?: string;
  phone?: string;
}

export const customerRepository = {
  async getCustomerList(
    page: number,
    pageSize: number,
    filters: CustomerListFilters = {},
  ) {
    page = Math.max(1, page);
    pageSize = Math.min(100, Math.max(1, pageSize));

    const baseQuery = db
      .select({
        id: customersTable.id,
        name: customersTable.name,
        email: customersTable.email,
        phone: customersTable.phone,
        platform: customersTable.platform,
        weixinOpenId: customersTable.weixinOpenId,
        alipayOpenId: customersTable.alipayOpenId,
        status: customersTable.status,
        createdAt: customersTable.createdAt,
        updatedAt: customersTable.updatedAt,
      })
      .from(customersTable)
      .orderBy(customersTable.id)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(customersTable)
      .$dynamic();

    const conditions: SQL[] = [];
    const { id, status, name, email, phone } = filters;

    if (id !== undefined) {
      conditions.push(eq(customersTable.id, id));
    }
    if (status !== undefined) {
      conditions.push(eq(customersTable.status, status));
    }
    if (name?.trim()) {
      conditions.push(sql`${customersTable.name} like ${`%${name.trim()}%`}`);
    }
    if (email?.trim()) {
      conditions.push(sql`${customersTable.email} like ${`%${email.trim()}%`}`);
    }
    if (phone?.trim()) {
      conditions.push(sql`${customersTable.phone} like ${`%${phone.trim()}%`}`);
    }

    if (conditions.length > 0) {
      const where = and(...conditions);
      if (where) {
        baseQuery.where(where);
        countQuery.where(where);
      }
    }

    const [items, countResult] = await Promise.all([
      withPagination(baseQuery, page, pageSize),
      countQuery,
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  },
};
