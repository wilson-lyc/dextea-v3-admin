import { redis } from '@/plugins/db/redis/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { SystemErrorCodes } from '@/common/constants/error-code.constant.js';

/**
 * 基于 Redis 的分布式锁。
 * 仅持有锁的实例可以执行被保护的写操作，避免两个请求并发修改同一资源
 * （例如客制化选项的原料绑定与用量）造成数据竞争 / 视图不一致。
 */

const DEFAULT_TTL_MS = 10_000;
const LOCK_PREFIX = 'dextea:lock:';

/** 申请锁，成功返回 token（释放时使用），失败（已被占用）返回 null */
async function acquireLock(key: string, ttlMs: number): Promise<string | null> {
  try {
    const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = await redis.set(`${LOCK_PREFIX}${key}`, token, 'PX', ttlMs, 'NX');
    return result === 'OK' ? token : null;
  } catch {
    throw new BizError(SystemErrorCodes.LOCK_ACQUIRE_FAILED);
  }
}

/** 仅当仍由自己持有时释放锁，避免误删他人锁 */
async function releaseLock(key: string, token: string): Promise<void> {
  const script = `
    if redis.call('get', KEYS[1]) == ARGV[1] then
      return redis.call('del', KEYS[1])
    end
    return 0
  `;
  try {
    await redis.eval(script, 1, `${LOCK_PREFIX}${key}`, token);
  } catch {
    // 释放失败不阻断主流程，锁会随 TTL 自动过期
  }
}

/**
 * 在分布式锁保护下执行写操作。
 * @param key 锁键（建议按资源维度，如 `customization-option:bind:{optionId}`）
 * @param fn  受保护的写操作
 * @param ttlMs 锁过期时间（毫秒），防止持有者崩溃导致死锁
 */
export async function withDistributedLock<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const token = await acquireLock(key, ttlMs);
  if (!token) {
    throw new BizError(SystemErrorCodes.LOCK_CONFLICT);
  }
  try {
    return await fn();
  } finally {
    await releaseLock(key, token);
  }
}
