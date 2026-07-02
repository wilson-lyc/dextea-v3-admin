import { MySqlSelect } from 'drizzle-orm/mysql-core';

/**
 * 为动态查询构建器追加 LIMIT / OFFSET 分页子句。
 * 基于 Drizzle 动态查询构建模式，需先调用 `.$dynamic()` 开启动态模式。
 *
 * @example
 * const rows = await withPagination(
 *   db.select().from(table).where(...).$dynamic(),
 *   1,
 *   20,
 * );
 */
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
