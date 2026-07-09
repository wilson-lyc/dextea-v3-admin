import type { FastifyInstance } from 'fastify';
import { getDb } from '../plugins/db/mysql/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { getInitStatus, initialize } from '../services/init.service.js';
import type { ApiResponse, InitStatusData, InitRequest } from '@dextea/shared-types';

export async function initRoutes(app: FastifyInstance) {
  /** 初始化状态 */
  app.get<{ Reply: ApiResponse<InitStatusData> }>('/init/status', {
    schema: {
      description: '获取系统初始化状态',
      tags: ['System Init'],
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                initialized: { type: 'boolean' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (_request, _reply) => {
    try {
      const db = await getDb();
      const data = await getInitStatus(db);
      return { code: 0, data, message: 'ok' };
    } catch (error) {
      if (error instanceof BizError) throw error;
      throw new BizError({ code: 10501, message: '初始化失败，请检查数据库连接或稍后重试' }, undefined, 200);
    }
  });

  /** 系统初始化 */
  app.post<{ Body: InitRequest; Reply: ApiResponse<null> }>('/init', {
    schema: {
      description: '系统初始化（创建管理员账号）',
      tags: ['System Init'],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', minLength: 1, description: '管理员邮箱' },
          password: { type: 'string', minLength: 1, description: '密码' },
          displayName: { type: 'string', minLength: 1, description: '显示名称' },
        },
        required: ['email', 'password', 'displayName'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: { type: 'null' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();
      await initialize(db, request.body);
      return { code: 0, data: null, message: '初始化成功' };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError({ code: 10501, message: '初始化失败，请检查数据库连接或稍后重试' }, undefined, 200);
    }
  });
}
