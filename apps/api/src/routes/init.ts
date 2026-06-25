import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { configTable, usersTable } from '../db/schema.js';
import { hashPassword } from '../utils/password.js';
import { AppError } from '../errorcode/index.js';
import { initErrors } from '../errorcode/init.js';
import { userErrors } from '../errorcode/users.js';
import { validateRequired, validateEmail, validatePassword, validateMaxLength } from '../utils/validation.js';
import type { ApiResponse, InitStatusData, InitRequest } from '@dextea/shared-types';

export async function initRoutes(app: FastifyInstance) {
  /**
   * 初始化状态
   * url：/api/v1/init/status
   */
  app.get<{ Reply: ApiResponse<InitStatusData> }>('/init/status', async (_request, _reply) => {
    const db = await getDb();
    const record = await db
      .select()
      .from(configTable)
      .where(eq(configTable.key, 'Initialized'))
      .limit(1);

    return { code: 0, data: { initialized: record.length > 0 }, message: 'ok' };
  });

  /**
   * 系统初始化
   * url：/api/v1/init
   */
  app.post<{ Body: InitRequest; Reply: ApiResponse<null> }>('/init', async (request, reply) => {
    try {
      const db = await getDb();

      // Check if already initialized
      const record = await db
        .select()
        .from(configTable)
        .where(eq(configTable.key, 'Initialized'))
        .limit(1);

      if (record.length > 0) {
        throw new AppError(initErrors.ALREADY_INITIALIZED);
      }

      const { email, password, displayName } = request.body;

      validateRequired(email, '邮箱');
      validateRequired(password, '密码');
      validateRequired(displayName, '显示名称');
      validateEmail(email);
      validatePassword(password);
      validateMaxLength(displayName, 255, '显示名称');

      // Check if email already exists
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new AppError(initErrors.EMAIL_EXISTS);
      }

      // Create admin user
      const hashedPassword = await hashPassword(password);
      await db.insert(usersTable).values({
        email,
        password: hashedPassword,
        displayName,
      });

      // Set Initialized config
      await db.insert(configTable).values({
        key: 'Initialized',
        value: 'true',
        note: '系统初始化标记',
      });

      return { code: 0, data: null, message: '初始化成功' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(initErrors.INIT_FAILED);
    }
  });
}
