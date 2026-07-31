import { BizError } from '@/common/exceptions/index.js';
import { RoleErrorCodes } from './role.errorcode.js';
import { roleRepository } from './role.repository.js';
import { permissionRepository } from '@/module/permissions/permission.repository.js';
import { ROLE_STATUS, ROLE_STATUS_VALUES } from '@dextea-admin/contracts';
import type {
  RoleListRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  SetRolePermissionsRequest,
} from '@dextea-admin/contracts';

export const roleService = {
  async getRoleList(params: RoleListRequest) {
    return roleRepository.getRoleList(params.page, params.pageSize, params.keyword);
  },

  async getRoleOptions() {
    const items = await roleRepository.getActiveRoleOptions();
    return { items };
  },

  async createRole(input: CreateRoleRequest) {
    const name = input.name.trim();
    const note = input.note?.trim() ?? null;

    

    const existing = await roleRepository.getRoleByName(name);
    if (existing) {
      throw new BizError(RoleErrorCodes.NAME_EXISTS);
    }

    const id = await roleRepository.createRole({
      name,
      note,
      status: ROLE_STATUS.ACTIVE.value,
    });

    return { id, name };
  },

  async updateRole(id: number, input: UpdateRoleRequest) {
    const name = input.name.trim();
    const note = input.note?.trim() ?? null;

    

    const role = await roleRepository.getRoleById(id);
    if (!role) {
      throw new BizError(RoleErrorCodes.ROLE_NOT_FOUND);
    }

    const existing = await roleRepository.getRoleByName(name);
    if (existing && existing.id !== id) {
      throw new BizError(RoleErrorCodes.NAME_EXISTS_OTHER);
    }

    await roleRepository.updateRoleById(id, { name, note });

    return { id, name };
  },

  async updateRoleStatus(id: number, status: number) {
    if (!(ROLE_STATUS_VALUES as readonly number[]).includes(status)) {
      throw new BizError(RoleErrorCodes.INVALID_STATUS);
    }

    const role = await roleRepository.getRoleById(id);
    if (!role) {
      throw new BizError(RoleErrorCodes.ROLE_NOT_FOUND);
    }

    await roleRepository.updateRoleStatusById(id, status);

    return { name: role.name, status };
  },

  async getRolePermissions(id: number) {
    const role = await roleRepository.getRoleById(id);
    if (!role) {
      throw new BizError(RoleErrorCodes.ROLE_NOT_FOUND);
    }

    const permissionIds = await roleRepository.getRolePermissionIds(id);
    const permissions = await permissionRepository.getPermissionsByIds(permissionIds);

    return { permissionIds, permissions };
  },

  async setRolePermissions(id: number, input: SetRolePermissionsRequest) {
    const role = await roleRepository.getRoleById(id);
    if (!role) {
      throw new BizError(RoleErrorCodes.ROLE_NOT_FOUND);
    }

    // 去重
    const requestedIds = Array.from(new Set(input.permissionIds));

    // 校验所有权限 id 均真实存在
    const existingIds = await roleRepository.filterExistingPermissionIds(requestedIds);
    if (existingIds.length !== requestedIds.length) {
      throw new BizError(RoleErrorCodes.PERMISSION_NOT_FOUND);
    }

    await roleRepository.setRolePermissions(id, requestedIds);
  },
};
