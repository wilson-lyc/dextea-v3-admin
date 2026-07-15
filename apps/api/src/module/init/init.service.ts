import { BizError } from '@/common/exceptions/index.js';
import { InitErrorCodes } from './init.errorcode.js';
import { initRepository } from './init.repository.js';
import { validateEmail, validatePassword, validateMaxLength } from '@/utils';
import { hashPassword } from '@/plugins/password/index.js';
import { EMPLOYEE_STATUS } from '@dextea-admin/contracts';
import type { InitRequest } from '@dextea-admin/contracts';
import { SUPER_ROLE_NAME } from './init.presets.js';

export const initService = {
  async getInitStatus() {
    const record = await initRepository.getInitStatus();
    return { initialized: record !== null };
  },

  async initialize(input: InitRequest) {
    const { email, password, displayName } = input;

    // 检查是否已初始化
    const record = await initRepository.getInitStatus();
    if (record) {
      throw new BizError(InitErrorCodes.ALREADY_INITIALIZED);
    }

    // 校验
    validateEmail(email);
    validatePassword(password);
    validateMaxLength(displayName, 255, '显示名称');

    // 判重
    const existing = await initRepository.getEmployeeByEmail(email);
    if (existing) {
      throw new BizError(InitErrorCodes.EMAIL_EXISTS);
    }

    // 1. 写入预设权限数据（如超级权限 `*`）
    const permKeyToId = await initRepository.ensurePresetPermissions();

    // 2. 写入预设角色数据（如「超级管理员」）并绑定对应权限
    const roleNameToId = await initRepository.ensurePresetRoles(permKeyToId);

    // 3. 创建超级管理员账号
    const hashedPassword = await hashPassword(password);
    const adminId = await initRepository.createAdmin({
      email,
      password: hashedPassword,
      displayName,
      status: EMPLOYEE_STATUS.ACTIVE.value,
    });

    // 4. 为超级管理员绑定「超级管理员」角色
    const superRoleId = roleNameToId.get(SUPER_ROLE_NAME);
    if (superRoleId === undefined) {
      throw new BizError(InitErrorCodes.INIT_FAILED);
    }
    await initRepository.bindEmployeeRole(adminId, superRoleId);

    // 5. 写入初始化标记（幂等闸门，防止重复初始化）
    await initRepository.writeInitFlag();
  },
};
