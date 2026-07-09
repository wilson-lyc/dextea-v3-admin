import type { FastifyInstance } from 'fastify';
import { getDb } from '../plugins/db/mysql/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { StoreStatusErrorCodes } from '../errorcode/store-status.js';
import { parsePositiveInt } from '../utils/validation.js';
import {
  listStoreProducts,
  upsertProductStoreStatus,
  listStoreCustomizations,
  listStoreCustomizationOptions,
  upsertCustomizationOptionStoreStatus,
  listStoreIngredients,
} from '../services/store-status.service.js';
import type {
  ApiResponse,
  PaginatedData,
  StoreProductItem,
  UpsertProductStoreStatusRequest,
  StoreCustomizationItem,
  StoreCustomizationOptionItem,
  UpsertCustomizationOptionStoreStatusRequest,
  StoreIngredientItem,
} from '@dextea/shared-types';

export async function storeStatusRoutes(app: FastifyInstance) {
  /**
   * 门店商品列表（含门店状态）
   * url: /api/v1/stores/:storeId/products
   */
  app.get<{
    Params: { storeId: string };
    Querystring: { page?: string; pageSize?: string; globalStatus?: string; storeStatus?: string };
    Reply: ApiResponse<PaginatedData<StoreProductItem>>;
  }>('/stores/:storeId/products', {
    schema: {
      description: '门店商品列表（含门店状态）',
      tags: ['Store-Status'],
      params: {
        type: 'object',
        properties: {
          storeId: { type: 'string', minLength: 1, description: '门店ID' },
        },
        required: ['storeId'],
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码' },
          pageSize: { type: 'string', description: '每页条数' },
          globalStatus: { type: 'string', description: '全局状态 0=下架 1=可售' },
          storeStatus: { type: 'string', description: '门店状态 0=售罄 1=可售' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
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
                      price: { type: 'number' },
                      globalStatus: { type: 'integer' },
                      storeStatus: { type: 'integer' },
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
  }, async (request) => {
    try {
      const db = await getDb();
      const storeId = parsePositiveInt(request.params.storeId, '门店ID');

      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));

      let globalStatus: number | undefined;
      if (request.query.globalStatus !== undefined) {
        const gs = parseInt(request.query.globalStatus, 10);
        if (gs === 0 || gs === 1) {
          globalStatus = gs;
        }
      }

      let storeStatus: number | undefined;
      if (request.query.storeStatus !== undefined) {
        const ss = parseInt(request.query.storeStatus, 10);
        if (ss === 0 || ss === 1) {
          storeStatus = ss;
        }
      }

      const data = await listStoreProducts(db, storeId, { page, pageSize, globalStatus, storeStatus });

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(StoreStatusErrorCodes.LIST_PRODUCTS_FAILED);
    }
  });

  /**
   * 设置商品门店状态
   * url: /api/v1/stores/:storeId/products/:productId/status
   */
  app.patch<{
    Params: { storeId: string; productId: string };
    Body: UpsertProductStoreStatusRequest;
    Reply: ApiResponse<null>;
  }>('/stores/:storeId/products/:productId/status', {
    schema: {
      description: '设置商品门店状态',
      tags: ['Store-Status'],
      params: {
        type: 'object',
        properties: {
          storeId: { type: 'string', minLength: 1, description: '门店ID' },
          productId: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['storeId', 'productId'],
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'integer', description: '0=下架 1=可售' },
        },
        required: ['status'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            data: { type: 'null' },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const storeId = parsePositiveInt(request.params.storeId, '门店ID');
      const productId = parsePositiveInt(request.params.productId, '商品ID');
      const { status } = request.body;

      await upsertProductStoreStatus(db, storeId, productId, status);

      return {
        code: 0,
        data: null,
        message: status === 1 ? '已启用' : '已禁用',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(StoreStatusErrorCodes.UPDATE_PRODUCT_STATUS_FAILED);
    }
  });

  /**
   * 门店客制化项目列表（含门店状态）
   * url: /api/v1/stores/:storeId/customizations
   */
  app.get<{
    Params: { storeId: string };
    Querystring: { page?: string; pageSize?: string };
    Reply: ApiResponse<PaginatedData<StoreCustomizationItem>>;
  }>('/stores/:storeId/customizations', {
    schema: {
      description: '门店客制化项目列表（含门店状态）',
      tags: ['Store-Status'],
      params: {
        type: 'object',
        properties: {
          storeId: { type: 'string', minLength: 1, description: '门店ID' },
        },
        required: ['storeId'],
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码' },
          pageSize: { type: 'string', description: '每页条数' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
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
                      globalStatus: { type: 'integer' },
                      storeStatus: { type: 'integer' },
                      optionCount: { type: 'integer' },
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
  }, async (request) => {
    try {
      const db = await getDb();
      const storeId = parsePositiveInt(request.params.storeId, '门店ID');

      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));

      const data = await listStoreCustomizations(db, storeId, { page, pageSize });

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(StoreStatusErrorCodes.LIST_CUSTOMIZATIONS_FAILED);
    }
  });

  /**
   * 门店客制化选项列表（含门店状态）
   * url: /api/v1/stores/:storeId/customizations/:customizationId/options
   */
  app.get<{
    Params: { storeId: string; customizationId: string };
    Querystring: { page?: string; pageSize?: string };
    Reply: ApiResponse<PaginatedData<StoreCustomizationOptionItem>>;
  }>('/stores/:storeId/customizations/:customizationId/options', {
    schema: {
      description: '门店客制化选项列表（含门店状态）',
      tags: ['Store-Status'],
      params: {
        type: 'object',
        properties: {
          storeId: { type: 'string', minLength: 1, description: '门店ID' },
          customizationId: { type: 'string', minLength: 1, description: '客制化项目ID' },
        },
        required: ['storeId', 'customizationId'],
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码' },
          pageSize: { type: 'string', description: '每页条数' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
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
                      price: { type: 'number' },
                      globalStatus: { type: 'integer' },
                      storeStatus: { type: 'integer' },
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
  }, async (request) => {
    try {
      const db = await getDb();
      const storeId = parsePositiveInt(request.params.storeId, '门店ID');
      const customizationId = parsePositiveInt(request.params.customizationId, '客制化项目ID');

      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));

      const data = await listStoreCustomizationOptions(db, storeId, customizationId, { page, pageSize });

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(StoreStatusErrorCodes.LIST_OPTIONS_FAILED);
    }
  });

  /**
   * 设置客制化选项门店状态
   * url: /api/v1/stores/:storeId/customization-options/:optionId/status
   */
  app.patch<{
    Params: { storeId: string; optionId: string };
    Body: UpsertCustomizationOptionStoreStatusRequest;
    Reply: ApiResponse<null>;
  }>('/stores/:storeId/customization-options/:optionId/status', {
    schema: {
      description: '设置客制化选项门店状态',
      tags: ['Store-Status'],
      params: {
        type: 'object',
        properties: {
          storeId: { type: 'string', minLength: 1, description: '门店ID' },
          optionId: { type: 'string', minLength: 1, description: '客制化选项ID' },
        },
        required: ['storeId', 'optionId'],
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'integer', description: '0=下架 1=启用' },
        },
        required: ['status'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            data: { type: 'null' },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const storeId = parsePositiveInt(request.params.storeId, '门店ID');
      const optionId = parsePositiveInt(request.params.optionId, '客制化选项ID');
      const { status } = request.body;

      await upsertCustomizationOptionStoreStatus(db, storeId, optionId, status);

      return {
        code: 0,
        data: null,
        message: status === 1 ? '已启用' : '已禁用',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(StoreStatusErrorCodes.UPDATE_OPTION_STATUS_FAILED);
    }
  });

  /**
   * 门店原料库存列表
   * url: /api/v1/stores/:storeId/ingredients
   */
  app.get<{
    Params: { storeId: string };
    Querystring: { page?: string; pageSize?: string };
    Reply: ApiResponse<PaginatedData<StoreIngredientItem>>;
  }>('/stores/:storeId/ingredients', {
    schema: {
      description: '门店原料库存列表',
      tags: ['Store-Status'],
      params: {
        type: 'object',
        properties: {
          storeId: { type: 'string', minLength: 1, description: '门店ID' },
        },
        required: ['storeId'],
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码' },
          pageSize: { type: 'string', description: '每页条数' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
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
                      unit: { type: 'string' },
                      quantity: { type: 'number' },
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
  }, async (request) => {
    try {
      const db = await getDb();
      const storeId = parsePositiveInt(request.params.storeId, '门店ID');

      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));

      const data = await listStoreIngredients(db, storeId, { page, pageSize });

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(StoreStatusErrorCodes.LIST_INGREDIENTS_FAILED);
    }
  });
}
