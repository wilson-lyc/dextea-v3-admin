import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { configTable, usersTable } from '../db/schema.js';
import { hashPassword } from '../utils/password.js';

export async function initRoutes(app: FastifyInstance) {
  // Check if system is initialized
  app.get('/init/status', async (_request, _reply) => {
    const db = await getDb();
    const record = await db
      .select()
      .from(configTable)
      .where(eq(configTable.key, 'Initialized'))
      .limit(1);

    const initialized = record.length > 0 && record[0].value === 'true';

    return { code: 0, data: { initialized }, message: 'ok' };
  });

  // Initialize system (create admin user)
  app.post<{
    Body: { email: string; password: string; displayName: string };
  }>('/init', async (request, reply) => {
    const db = await getDb();

    // Check if already initialized
    const record = await db
      .select()
      .from(configTable)
      .where(eq(configTable.key, 'Initialized'))
      .limit(1);

    if (record.length > 0 && record[0].value === 'true') {
      return reply.status(400).send({
        code: 1,
        data: null,
        message: '系统已初始化，请勿重复操作',
      });
    }

    const { email, password, displayName } = request.body;

    if (!email || !password || !displayName) {
      return reply.status(400).send({
        code: 1,
        data: null,
        message: '请填写所有必填字段',
      });
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return reply.status(400).send({
        code: 1,
        data: null,
        message: '该邮箱已被使用',
      });
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
  });
}
