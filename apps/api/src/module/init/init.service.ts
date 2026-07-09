import { BizError } from '@/common/exceptions/index.js';
import { InitErrorCodes } from './init.errorcode.js';
import { initRepository } from './init.repository.js';
import { validateEmail, validatePassword, validateMaxLength } from '@/plugins/utils/validation.js';
import { hashPassword } from '@/plugins/utils/password.js';
import type { InitRequest } from './init.type.js';

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

    // 创建管理员
    const hashedPassword = await hashPassword(password);
    await initRepository.createAdmin({
      email,
      password: hashedPassword,
      displayName,
      status: 1,
    });

    // 写入初始化标记
    await initRepository.writeInitFlag();
  },
};
