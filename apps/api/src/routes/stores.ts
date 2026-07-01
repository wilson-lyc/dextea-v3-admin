import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { AppError } from '../errorcode/index.js';
import { storeErrors } from '../errorcode/stores.js';
import { parsePositiveInt } from '../utils/validation.js';
import {
  listStores,
  getStore,
  createStore,
  updateStore,
  updateStoreBasicInfo,
  updateStoreLocation,
  updateStoreStatus,
  resetStorePassword,
  syncStoreLocations,
} from '../services/store.service.js';
import { bindStoreMenu } from '../services/menu.service.js';
import type {
  ApiResponse,
  PaginatedData,
  Store,
  StoreQuery,
  CreateStoreInput,
  CreateStoreResponse,
  UpdateStoreInput,
  UpdateStoreResponse,
  UpdateStoreStatusRequest,
  UpdateStoreStatusResponse,
  UpdateStoreBasicInfoRequest,
  UpdateStoreBasicInfoResponse,
  UpdateStoreLocationRequest,
  UpdateStoreLocationResponse,
  ResetStorePasswordResponse,
  BindStoreMenuRequest,
  BindStoreMenuResponse,
} from '@dextea/shared-types';
import { STORE_STATUS } from '@dextea/shared-types';

const STORE_STATUS_LABEL: Record<number, string> = {
  [STORE_STATUS.RESTING.value]: '休息中',
  [STORE_STATUS.OPEN.value]: '营业中',
  [STORE_STATUS.PREPARING.value]: '筹备中',
  [STORE_STATUS.CLOSED.value]: '已注销',
};

export async function storeRoutes(app: FastifyInstance) {
  /** 门店列表 */
  app.get<{
    Querystring: StoreQuery;
    Reply: ApiResponse<PaginatedData<Store>>;
  }>('/stores', {
    schema: {
      description: '门店列表',
      tags: ['Stores'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码' },
          pageSize: { type: 'string', description: '每页条数' },
          keyword: { type: 'string', description: '搜索关键词' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                      province: { type: 'string' },
                      city: { type: 'string' },
                      district: { type: 'string' },
                      address: { type: 'string' },
                      status: { type: 'integer', description: '0=休息中 1=营业中 2=筹备中 3=已注销' },
                      businessHours: { type: 'string' },
                      phone: { type: 'string' },
                      longitude: { type: 'number' },
                      latitude: { type: 'number' },
                      account: { type: 'string' },
                      email: { type: 'string' },
                      menuId: { type: ['integer', 'null'], description: '绑定的菜单ID' },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' },
                    },
                  },
                },
                total: { type: 'integer' },
                page: { type: 'integer' },
                pageSize: { type: 'integer' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const keyword = request.query.keyword;

      const data = await listStores(db, { page, pageSize, keyword });

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.LIST_FAILED);
    }
  });

  /** 门店详情 */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<Store>;
  }>('/stores/:id', {
    schema: {
      description: '门店详情',
      tags: ['Stores'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '门店ID' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                province: { type: 'string' },
                city: { type: 'string' },
                district: { type: 'string' },
                address: { type: 'string' },
                status: { type: 'integer', description: '0=休息中 1=营业中 2=筹备中 3=已注销' },
                businessHours: { type: 'string' },
                phone: { type: 'string' },
                longitude: { type: 'number' },
                latitude: { type: 'number' },
                account: { type: 'string' },
                email: { type: 'string' },
                menuId: { type: ['integer', 'null'], description: '绑定的菜单ID' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '门店ID');

      const data = await getStore(db, id);

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.GET_FAILED);
    }
  });

  /** 新增门店 */
  app.post<{
    Body: CreateStoreInput;
    Reply: ApiResponse<CreateStoreResponse>;
  }>('/stores', {
    schema: {
      description: '新增门店',
      tags: ['Stores'],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: '门店名称' },
          province: { type: 'string', description: '省份' },
          city: { type: 'string', description: '城市' },
          district: { type: 'string', description: '区县' },
          address: { type: 'string', description: '详细地址' },
          businessHours: { type: 'string', description: '营业时间' },
          phone: { type: 'string', minLength: 1, description: '联系电话' },
          account: { type: 'string', minLength: 1, description: '登录账号' },
          email: { type: 'string', description: '邮箱' },
          longitude: { type: 'number', description: '经度' },
          latitude: { type: 'number', description: '纬度' },
        },
        required: ['name', 'account', 'phone'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                initialPassword: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();

      const data = await createStore(db, request.body, {
        requestLogWarn: (obj, msg) => request.log.warn(obj, msg),
        redis: request.server.redis,
      });

      return {
        code: 0,
        data,
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.CREATE_FAILED);
    }
  });

  /** 更新门店 */
  app.put<{
    Params: { id: string };
    Body: UpdateStoreInput;
    Reply: ApiResponse<UpdateStoreResponse>;
  }>('/stores/:id', {
    schema: {
      description: '更新门店',
      tags: ['Stores'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '门店ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: '门店名称' },
          province: { type: 'string', description: '省份' },
          city: { type: 'string', description: '城市' },
          district: { type: 'string', description: '区县' },
          address: { type: 'string', description: '详细地址' },
          status: { type: 'integer', description: '0=休息中 1=营业中 2=筹备中 3=已注销' },
          businessHours: { type: 'string', description: '营业时间' },
          phone: { type: 'string', description: '联系电话' },
          longitude: { type: 'number', description: '经度' },
          latitude: { type: 'number', description: '纬度' },
        },
        required: ['name'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '门店ID');

      const data = await updateStore(db, id, request.body);

      return {
        code: 0,
        data,
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.UPDATE_FAILED);
    }
  });

  /** 更新门店基础信息 */
  app.patch<{
    Params: { id: string };
    Body: UpdateStoreBasicInfoRequest;
    Reply: ApiResponse<UpdateStoreBasicInfoResponse>;
  }>('/stores/:id/basic-info', {
    schema: {
      description: '更新门店基础信息',
      tags: ['Stores'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '门店ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: '门店名称' },
          phone: { type: 'string', description: '联系电话' },
          businessHours: { type: 'string', description: '营业时间' },
          email: { type: 'string', description: '邮箱' },
        },
        required: ['name'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '门店ID');

      const data = await updateStoreBasicInfo(db, id, request.body);

      return {
        code: 0,
        data,
        message: '门店基础信息更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.BASIC_INFO_UPDATE_FAILED);
    }
  });

  /** 更新门店位置 */
  app.patch<{
    Params: { id: string };
    Body: UpdateStoreLocationRequest;
    Reply: ApiResponse<UpdateStoreLocationResponse>;
  }>('/stores/:id/location', {
    schema: {
      description: '更新门店位置',
      tags: ['Stores'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '门店ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          province: { type: 'string', description: '省份' },
          city: { type: 'string', description: '城市' },
          district: { type: 'string', description: '区县' },
          address: { type: 'string', description: '详细地址' },
          longitude: { type: 'number', description: '经度' },
          latitude: { type: 'number', description: '纬度' },
        },
        required: [],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '门店ID');

      const data = await updateStoreLocation(db, id, request.body, { redis: request.server.redis });

      return {
        code: 0,
        data,
        message: '门店位置更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.LOCATION_UPDATE_FAILED);
    }
  });

  /** 同步门店定位数据到 Redis */
  app.post<{
    Reply: ApiResponse<{ synced: number }>;
  }>('/stores/sync-locations', {
    schema: {
      description: '同步门店定位数据到 Redis',
      tags: ['Stores'],
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                synced: { type: 'integer' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();

      const data = await syncStoreLocations(db, { redis: request.server.redis });

      return {
        code: 0,
        data,
        message: `同步完成，共同步 ${data.synced} 家门店`,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.SYNC_FAILED);
    }
  });

  /** 更新门店状态 */
  app.patch<{
    Params: { id: string };
    Body: UpdateStoreStatusRequest;
    Reply: ApiResponse<UpdateStoreStatusResponse>;
  }>('/stores/:id/status', {
    schema: {
      description: '更新门店状态',
      tags: ['Stores'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '门店ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'integer', description: '0=休息中 1=营业中 2=筹备中 3=已注销' },
        },
        required: ['status'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                status: { type: 'integer', description: '0=休息中 1=营业中 2=筹备中 3=已注销' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '门店ID');
      const { status } = request.body;

      const data = await updateStoreStatus(db, id, status);

      return {
        code: 0,
        data,
        message: `门店状态已更新为「${STORE_STATUS_LABEL[status] ?? status}」`,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.STATUS_UPDATE_FAILED);
    }
  });

  /** 重置门店密码 */
  app.post<{
    Params: { id: string };
    Reply: ApiResponse<ResetStorePasswordResponse>;
  }>('/stores/:id/reset-password', {
    schema: {
      description: '重置门店密码',
      tags: ['Stores'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '门店ID' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                newPassword: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '门店ID');

      const data = await resetStorePassword(db, id);

      return {
        code: 0,
        data,
        message: '密码重置成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.RESET_PASSWORD_FAILED);
    }
  });

  /** 绑定门店菜单 */
  app.patch<{
    Params: { id: string };
    Body: BindStoreMenuRequest;
    Reply: ApiResponse<BindStoreMenuResponse>;
  }>('/stores/:id/menu', {
    schema: {
      description: '绑定门店菜单',
      tags: ['Stores'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '门店ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          menuId: { type: ['integer', 'null'], description: '菜单ID，null表示解绑' },
        },
        required: ['menuId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                menuId: { type: ['integer', 'null'] },
              },
            },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '门店ID');
      const { menuId } = request.body;

      const data = await bindStoreMenu(db, id, menuId);

      return {
        code: 0,
        data,
        message: menuId === null ? '菜单解绑成功' : '菜单绑定成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeErrors.MENU_BIND_FAILED);
    }
  });
}
