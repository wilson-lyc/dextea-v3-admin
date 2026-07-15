import type { BizErrorCode } from '@/common/types';

/**
 * 角色管理错误码 (11200-11299)
 */
export const RoleErrorCodes = {
  NAME_REQUIRED: { code: 11200, message: '角色名称不能为空' },
  ROLE_NOT_FOUND: { code: 11201, message: '角色不存在' },
  NAME_EXISTS: { code: 11202, message: '该角色名称已被使用' },
  NAME_EXISTS_OTHER: { code: 11203, message: '该角色名称已被其他角色使用' },
  INVALID_STATUS: { code: 11204, message: '角色状态值不合法' },
  LIST_FAILED: { code: 11205, message: '获取角色列表失败' },
  CREATE_FAILED: { code: 11206, message: '创建角色失败' },
  UPDATE_FAILED: { code: 11207, message: '更新角色失败' },
  DELETE_FAILED: { code: 11208, message: '删除角色失败' },
  PERMISSION_NOT_FOUND: { code: 11209, message: '存在无效的权限，请刷新后重试' },
  SET_PERMISSIONS_FAILED: { code: 11210, message: '设置角色权限失败' },
} as const satisfies Record<string, BizErrorCode>;
