import { and, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { customers } from '@/plugins/db/mysql/schema.js';
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
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        platform: customers.platform,
        weixinOpenId: customers.weixinOpenId,
        alipayOpenId: customers.alipayOpenId,
        status: customers.status,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .orderBy(customers.id)
      .$dynamic();

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .$dynamic();

    const conditions: SQL[] = [];
    const { id, status, name, email, phone } = filters;

    if (id !== undefined) {
      conditions.push(eq(customers.id, id));
    }
    if (status !== undefined) {
      conditions.push(eq(customers.status, status));
    }
    if (name?.trim()) {
      conditions.push(sql`${customers.name} like ${`%${name.trim()}%`}`);
    }
    if (email?.trim()) {
      conditions.push(sql`${customers.email} like ${`%${email.trim()}%`}`);
    }
    if (phone?.trim()) {
      conditions.push(sql`${customers.phone} like ${`%${phone.trim()}%`}`);
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
