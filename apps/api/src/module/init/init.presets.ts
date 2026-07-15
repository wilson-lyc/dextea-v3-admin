import { ROLE_STATUS } from '@dextea-admin/contracts';

/** 超级权限键：匹配任意资源的读写 */
export const SUPER_PERMISSION_KEY = '*';

/** 「超级管理员」角色名（与初始化绑定、鉴权逻辑保持一致） */
export const SUPER_ROLE_NAME = '超级管理员';

/**
 * 预设权限：初始化时写入系统的内置权限。
 * key 需全局唯一，对应 schema 中 `permissions.key` 的唯一约束。
 */
export const PRESET_PERMISSIONS = [
  {
    key: SUPER_PERMISSION_KEY,
    name: '超级权限',
    note: '拥有所有资源的读写权限',
  },
] as const;

/**
 * 预设角色：初始化时写入系统的内置角色。
 *
 * - `status` 取自 `@dextea-admin/contracts` 的 ROLE_STATUS，保证与业务状态枚举一致。
 * - `permissions` 为该角色需要绑定的权限 key 列表（引用 PRESET_PERMISSIONS 中的 key）。
 */
export const PRESET_ROLES = [
  {
    name: SUPER_ROLE_NAME,
    note: '系统内置角色，拥有全部权限',
    status: ROLE_STATUS.ACTIVE.value,
    permissions: [SUPER_PERMISSION_KEY],
  },
] as const;
