import type { FastifyRequest, FastifyReply } from 'fastify';
import { BizError } from '@/common/exceptions/index.js';
import { SystemErrorCodes } from '@/common/constants/error-code.constant.js';

/**
 * 判断已授予的权限集合是否满足某个所需权限。
 *
 * 权限键格式为 `资源:动作`，例如 `employee:read`、`employee:write`。
 * 支持通配符：
 * - `*` 或 `*:*`         —— 超级权限，满足任何所需权限
 * - `<资源>:*`           —— 该资源的读写全部满足（如 `employee:*` 满足 `employee:read`）
 * - `*:<动作>`           —— 任意资源的该动作（如 `*:read` 满足 `employee:read`）
 * - `<资源>:<动作>`      —— 精确匹配
 */
export function hasPermission(granted: readonly string[], required: string): boolean {
  if (granted.length === 0) return false;

  const [reqResource, reqAction] = required.split(':');

  for (const g of granted) {
    if (g === '*' || g === '*:*') return true;
    if (g === required) return true;

    const [gResource, gAction] = g.split(':');
    if (gResource === reqResource && gAction === '*') return true;
    if (gResource === '*' && gAction === reqAction) return true;
  }

  return false;
}

/** 取出当前请求的登录态（未登录抛 401） */
function requireAuth(request: FastifyRequest) {
  const auth = request.authEmployee;
  if (!auth) {
    throw new BizError(SystemErrorCodes.HTTP_UNAUTHORIZED, undefined, 401);
  }
  return auth;
}

/**
 * 权限守卫工厂：在 Controller 路由的 `preHandler` 中挂载即可实现接口级鉴权。
 *
 * 采用 AND 语义：调用方需同时具备列出的全部权限。
 *
 * @example
 * app.get('/roles', {
 *   schema: { ... },
 *   preHandler: withPermission('role:read'),
 * }, handler)
 */
export function withPermission(...required: string[]) {
  return async function permissionGuard(request: FastifyRequest, _reply: FastifyReply) {
    const auth = requireAuth(request);
    const granted = auth.permissions ?? [];

    const missing = required.filter((key) => !hasPermission(granted, key));
    if (missing.length > 0) {
      throw new BizError(
        SystemErrorCodes.FORBIDDEN,
        `缺少权限：${missing.join('、')}`,
        403,
      );
    }
  };
}

/**
 * 角色守卫工厂：在 Controller 路由的 `preHandler` 中挂载即可按角色鉴权。
 *
 * 采用 OR 语义：调用方具备列出的任意一个角色即可通过。
 *
 * @example
 * app.delete('/roles/:id', {
 *   schema: { ... },
 *   preHandler: withRole('超级管理员'),
 * }, handler)
 */
export function withRole(...roles: string[]) {
  return async function roleGuard(request: FastifyRequest, _reply: FastifyReply) {
    const auth = requireAuth(request);
    const owned = auth.roles ?? [];

    const passed = roles.some((r) => owned.includes(r));
    if (!passed) {
      throw new BizError(
        SystemErrorCodes.FORBIDDEN,
        `需要以下角色之一：${roles.join('、')}`,
        403,
      );
    }
  };
}
