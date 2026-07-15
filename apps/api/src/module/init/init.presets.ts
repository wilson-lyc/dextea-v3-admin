import { ROLE_STATUS } from '@dextea-admin/contracts';


export const SUPER_PERMISSION_KEY = '*';
export const SUPER_ROLE_NAME = '超级管理员';

/** 预设权限 */
export const PRESET_PERMISSIONS = [
  {
    key: SUPER_PERMISSION_KEY,
    name: '超级权限',
    note: '拥有所有资源的读写权限',
  },
] as const;

/** 预设角色 */
export const PRESET_ROLES = [
  {
    name: SUPER_ROLE_NAME,
    note: '系统内置角色，拥有全部权限',
    status: ROLE_STATUS.ACTIVE.value,
    permissions: [SUPER_PERMISSION_KEY],
  },
] as const;
