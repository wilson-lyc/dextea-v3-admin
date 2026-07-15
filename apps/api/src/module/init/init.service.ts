import { BizError } from '@/common/exceptions/index.js';
import { InitErrorCodes } from './init.errorcode.js';
import { initRepository } from './init.repository.js';
import { hashPassword } from '@/plugins/password/index.js';
import { db } from '@/plugins/db/mysql/index.js';
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

    // 快速幂等检查：已初始化直接拒绝，避免无谓开启事务
    const record = await initRepository.getInitStatus();
    if (record) {
      throw new BizError(InitErrorCodes.ALREADY_INITIALIZED);
    }

    // 整体在一个事务内完成，保证「要么全部成功、要么全部回滚可重试」，
    // 并在事务开始处抢占初始化标记作为幂等闸门，杜绝并发/重试导致的重复初始化。
    await db.transaction(async (tx) => {
      // 幂等闸门：config.key 唯一约束保证只有一个请求能抢占成功，
      // 并发或失败重试若标记已存在会转为 ALREADY_INITIALIZED。
      await initRepository.claimInitFlag(tx);

      // 判重：邮箱已存在则不允许覆盖
      const existing = await initRepository.getEmployeeByEmail(tx, email);
      if (existing) {
        throw new BizError(InitErrorCodes.EMAIL_EXISTS);
      }

      // 写入预设权限数据，已存在则跳过
      const permKeyToId = await initRepository.ensurePresetPermissions(tx);

      // 写入预设角色数据并绑定对应权限，已存在则跳过
      const roleNameToId = await initRepository.ensurePresetRoles(tx, permKeyToId);

      // 创建超级管理员账号
      const hashedPassword = await hashPassword(password);
      const adminId = await initRepository.createAdmin(tx, {
        email,
        password: hashedPassword,
        displayName,
        status: EMPLOYEE_STATUS.ACTIVE.value,
      });

      // 为超级管理员绑定角色
      const superRoleId = roleNameToId.get(SUPER_ROLE_NAME);
      if (superRoleId === undefined) {
        throw new BizError(InitErrorCodes.INIT_FAILED);
      }
      await initRepository.bindEmployeeRole(tx, adminId, superRoleId);
    });
  },
};
