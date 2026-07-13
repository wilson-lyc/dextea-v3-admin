/**
 * 判断数据库异常是否为唯一键（含主键）冲突。
 * mysql2 在违反唯一约束时抛出的错误 code 为 'ER_DUP_ENTRY'。
 */
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'ER_DUP_ENTRY'
  );
}
