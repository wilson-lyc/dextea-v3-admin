import { MySqlSelect } from 'drizzle-orm/mysql-core';

export function withPagination<T extends MySqlSelect>(
  qb: T,
  page: number,
  pageSize: number,
) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const offset = (safePage - 1) * safePageSize;

  return qb.limit(safePageSize).offset(offset);
}
