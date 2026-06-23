import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '../db/index.js';
import { usersTable } from '../db/schema.js';
import { hashPassword } from '../utils/password.js';

export async function userRoutes(app: FastifyInstance) {
  // List users (paginated)
  app.get<{
    Querystring: { page?: string; pageSize?: string };
  }>('/users', async (request, reply) => {
    try {
      const db = await getDb();
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const items = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          displayName: usersTable.displayName,
          status: usersTable.status,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
        })
        .from(usersTable)
        .limit(pageSize)
        .offset(offset)
        .orderBy(usersTable.id);

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(usersTable);

      const total = Number(result[0]?.count ?? 0);

      return {
        code: 0,
        data: { items, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        code: 1,
        data: null,
        message: '获取用户列表失败',
      });
    }
  });

  // Create user
  app.post<{
    Body: { email: string; displayName: string };
  }>('/users', async (request, reply) => {
    try {
      const db = await getDb();
      const { email, displayName } = request.body;

      if (!email || !displayName) {
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

      // Generate random password (12 characters)
      const initialPassword = nanoid(12);
      const hashedPassword = await hashPassword(initialPassword);

      const result = await db.insert(usersTable).values({
        email,
        password: hashedPassword,
        displayName,
        status: 0, // Default disabled
      });

      const insertId = Number(result[0]?.insertId ?? 0);

      return {
        code: 0,
        data: {
          user: {
            id: insertId,
            email,
            displayName,
            status: 0 as const,
          },
          initialPassword,
        },
        message: '创建成功',
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        code: 1,
        data: null,
        message: '创建用户失败',
      });
    }
  });

  // Update user
  app.put<{
    Params: { id: string };
    Body: { email: string; displayName: string; status: number };
  }>('/users/:id', async (request, reply) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);
      const { email, displayName, status } = request.body;

      if (!email || !displayName) {
        return reply.status(400).send({
          code: 1,
          data: null,
          message: '请填写所有必填字段',
        });
      }

      // Check if user exists
      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .limit(1);

      if (user.length === 0) {
        return reply.status(404).send({
          code: 1,
          data: null,
          message: '用户不存在',
        });
      }

      // Check email uniqueness (excluding self)
      const existingEmail = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (existingEmail.length > 0 && existingEmail[0].id !== id) {
        return reply.status(400).send({
          code: 1,
          data: null,
          message: '该邮箱已被其他用户使用',
        });
      }

      await db
        .update(usersTable)
        .set({
          email,
          displayName,
          status,
        })
        .where(eq(usersTable.id, id));

      return {
        code: 0,
        data: {
          id,
          email,
          displayName,
          status,
        },
        message: '更新成功',
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        code: 1,
        data: null,
        message: '更新用户失败',
      });
    }
  });

  // Toggle user status
  app.patch<{
    Params: { id: string };
  }>('/users/:id/status', async (request, reply) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);

      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .limit(1);

      if (user.length === 0) {
        return reply.status(404).send({
          code: 1,
          data: null,
          message: '用户不存在',
        });
      }

      const newStatus = user[0].status === 0 ? 1 : 0;

      await db
        .update(usersTable)
        .set({ status: newStatus })
        .where(eq(usersTable.id, id));

      return {
        code: 0,
        data: { status: newStatus },
        message: newStatus === 1 ? '已激活' : '已禁用',
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        code: 1,
        data: null,
        message: '操作失败',
      });
    }
  });
}
