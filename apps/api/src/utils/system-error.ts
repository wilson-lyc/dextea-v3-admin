/**
 * 判断错误是否来自底层基础设施（数据库 / Redis / 网络）。
 *
 * 这类错误属于系统级故障，应当被全局异常拦截器统一兜底为「服务器内部异常」，
 * 而不应以具体业务失败信息（如「创建失败」）暴露给用户。
 */

interface MaybeSystemError {
  code?: string;
  errno?: number;
  sqlState?: string;
  name?: string;
}

const NETWORK_ERROR_CODES = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH'];
const REDIS_NAME_RE = /redis/i;

export function isSystemError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const e = error as Error & MaybeSystemError;

  // MySQL / Drizzle(mysql2) 错误特征
  if (typeof e.code === 'string') {
    if (e.code.startsWith('ER_') || e.code.startsWith('PROTOCOL_')) return true;
    if (NETWORK_ERROR_CODES.includes(e.code)) return true;
  }
  if (typeof e.sqlState === 'string') return true;
  if (typeof e.errno === 'number') return true;

  // Redis (ioredis) 错误特征
  if (typeof e.name === 'string' && REDIS_NAME_RE.test(e.name)) return true;

  return false;
}
