import type { FastifyRequest, FastifyReply } from 'fastify';
import { BizError } from '@/common/exceptions/index.js';
import { AuthErrorCodes } from '../errorcode/auth.js';

// Redis key 前缀
const TOKEN_PREFIX = 'dextea:admin:token:';

// 无需 token 校验的白名单路径（精确匹配或前缀匹配）
const AUTH_WHITELIST = [
  '/health',
  '/api/v1/auth/login',
  '/api/v1/init',
  '/api/v1/docs',
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

  // 从 Redis 中查找会话数据
  let sessionData: string | null;
  try {
    sessionData = await request.server.redis.get(`${TOKEN_PREFIX}${token}`);
  } catch (error) {
    request.log.error({ err: error }, 'Redis lookup failed during auth');
    const err = new BizError(AuthErrorCodes.INVALID_TOKEN, undefined, 401);
    return reply.status(err.httpStatus).send(err.toResponse());
  }

  if (!sessionData) {
    const err = new BizError(AuthErrorCodes.INVALID_TOKEN, undefined, 401);
    return reply.status(err.httpStatus).send(err.toResponse());
  }

  // 将用户信息附加到请求上，供下游处理
  request.authEmployee = JSON.parse(sessionData);
}
