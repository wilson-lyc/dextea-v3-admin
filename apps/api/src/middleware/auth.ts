import type { FastifyRequest, FastifyReply } from 'fastify';
import { BizError } from '@/common/exceptions/index.js';
import { AuthErrorCodes } from '@/module/auth/auth.errorcode.js';
import { TOKEN_PREFIX, TOKEN_TTL } from '@/module/auth/auth.service.js';

// 无需 token 校验的白名单路径（精确匹配或前缀匹配）
const AUTH_WHITELIST = [
  '/health',
  '/api/v2/auth/login',
  '/api/v2/init',
  '/api/v2/docs',
] as const;

function isWhitelisted(pathname: string): boolean {
  return AUTH_WHITELIST.some(
    (entry) => pathname === entry || pathname.startsWith(entry + '/'),
  );
}

declare module 'fastify' {
  interface FastifyRequest {
    authEmployee: {
      userId: number;
      email: string;
      displayName: string;
    } | null;
  }
}

export async function authHook(request: FastifyRequest, reply: FastifyReply) {
  // 去掉查询参数，只取路径部分
  const pathname = request.url.split('?')[0];

  // 白名单路径跳过认证
  if (isWhitelisted(pathname)) {
    return;
  }

  // 从请求头中提取 Bearer token
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new BizError(AuthErrorCodes.INVALID_TOKEN, undefined, 401);
    return reply.status(err.httpStatus).send(err.toResponse());
  }

  const token = authHeader.slice(7);
  const tokenKey = `${TOKEN_PREFIX}${token}`;

  // 从 Redis 中查找会话数据
  let sessionData: string | null;
  try {
    sessionData = await request.server.redis.get(tokenKey);
  } catch (error) {
    request.log.error({ err: error }, 'Redis lookup failed during auth');
    const err = new BizError(AuthErrorCodes.INVALID_TOKEN, undefined, 401);
    return reply.status(err.httpStatus).send(err.toResponse());
  }

  if (!sessionData) {
    const err = new BizError(AuthErrorCodes.INVALID_TOKEN, undefined, 401);
    return reply.status(err.httpStatus).send(err.toResponse());
  }

  // 每次成功访问（读/写）都刷新有效期，实现滑动过期（TTL 从当前时刻重新计时）
  try {
    await request.server.redis.expire(tokenKey, TOKEN_TTL);
  } catch (error) {
    // 刷新失败不阻断本次请求，仅记录日志
    request.log.warn({ err: error }, 'Failed to refresh token TTL');
  }

  // 将用户信息附加到请求上，供下游处理
  request.authEmployee = JSON.parse(sessionData);
}
