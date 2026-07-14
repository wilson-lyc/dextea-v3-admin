import { permissionRepository } from './permission.repository.js';
import type { PermissionListRequest } from '@dextea-admin/contracts';

export const permissionService = {
  async getPermissionList(params: PermissionListRequest) {
    return permissionRepository.getPermissionList(params.page, params.pageSize, params.keyword);
  },

  async getPermissionOptions() {
    const items = await permissionRepository.getAllPermissionOptions();
    return { items };
  },
};
