import { randomUUID } from 'node:crypto';
import { BizError } from '@/common/exceptions/index.js';
import { AuthErrorCodes } from './auth.errorcode.js';
import { authRepository } from './auth.repository.js';
import { validateEmail, validatePassword } from '@/plugins/utils/validation.js';
import { verifyPassword } from '@/plugins/utils/password.js';
import { EMPLOYEE_STATUS } from '@dextea-admin/contracts';
import type Redis from 'ioredis';

const TOKEN_PREFIX = 'dextea:admin:token:';
const TOKEN_TTL = 60 * 30; // 30 分钟

export const authService = {
  async login(account: string, password: string, redisClient: Redis) {
    validateEmail(account, '账号');
    validatePassword(password);

    const employee = await authRepository.getEmployeeByEmail(account);
    if (!employee) {
      throw new BizError(AuthErrorCodes.INVALID_CREDENTIALS, undefined, 401);
    }

    const valid = await verifyPassword(password, employee.password);
    if (!valid) {
      throw new BizError(AuthErrorCodes.INVALID_CREDENTIALS, undefined, 401);
    }

    if (employee.status === EMPLOYEE_STATUS.DISABLED.value) {
      throw new BizError(AuthErrorCodes.ACCOUNT_DISABLED, undefined, 401);
    }

    const token = randomUUID();
    const sessionData = JSON.stringify({
      userId: employee.id,
      email: employee.email,
      displayName: employee.displayName,
    });

    await redisClient.setex(`${TOKEN_PREFIX}${token}`, TOKEN_TTL, sessionData);

    return {
      token,
      user: {
        id: employee.id,
        email: employee.email,
        displayName: employee.displayName,
      },
    };
  },

  async logout(authHeader: string | undefined, redisClient: Redis) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BizError(AuthErrorCodes.INVALID_TOKEN, undefined, 401);
    }

    const token = authHeader.slice(7);
    await redisClient.del(`${TOKEN_PREFIX}${token}`);
  },
};
