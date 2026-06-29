import type { FastifyInstance } from 'fastify';
import { eq, and, sql, type SQL } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import {
  storesTable,
  productsTable,
  productStoreStatusTable,
  productCustomizationsTable,
  customizationOptionsTable,
  customizationOptionStoreStatusTable,
  ingredientsTable,
  storeInventoryTable,
} from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import { storeStatusErrors } from '../errorcode/store-status.js';
import { storeErrors } from '../errorcode/stores.js';
import { parsePositiveInt } from '../utils/validation.js';
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

      const [store] = await db
        .select({ id: storesTable.id })
        .from(storesTable)
        .where(eq(storesTable.id, storeId))
        .limit(1);
      if (!store) throw new AppError(storeErrors.STORE_NOT_FOUND);

      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const conditions: (SQL | undefined)[] = [];

      const rawGlobalStatus = request.query.globalStatus;
      if (rawGlobalStatus !== undefined) {
        const gs = parseInt(rawGlobalStatus, 10);
        if (gs === 0 || gs === 1) {
          conditions.push(eq(productsTable.status, gs));
        }
      }

      const rawStoreStatus = request.query.storeStatus;
      let storeStatusFilter: number | undefined;
      if (rawStoreStatus !== undefined) {
        const ss = parseInt(rawStoreStatus, 10);
        if (ss === 0 || ss === 1) {
          storeStatusFilter = ss;
        }
      }

      const baseQuery = db
        .select({
          id: productsTable.id,
          name: productsTable.name,
          price: productsTable.price,
          globalStatus: productsTable.status,
          storeStatus: sql<number>`COALESCE(${productStoreStatusTable.status}, 0)`,
        })
        .from(productsTable)
        .leftJoin(
          productStoreStatusTable,
          and(
            eq(productStoreStatusTable.productId, productsTable.id),
            eq(productStoreStatusTable.storeId, storeId),
          ),
        );

      if (conditions.length > 0) {
        baseQuery.where(and(...conditions));
      }

      if (storeStatusFilter !== undefined) {
        baseQuery.having(eq(sql`COALESCE(${productStoreStatusTable.status}, 0)`, storeStatusFilter));
      }

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(productsTable);

      const total = Number(countResult[0]?.count ?? 0);

      const rows = await baseQuery
        .limit(pageSize)
        .offset(offset)
        .orderBy(productsTable.id);

      return {
        code: 0,
        data: { items: rows, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeStatusErrors.LIST_PRODUCTS_FAILED);
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

      const [store] = await db
        .select({ id: storesTable.id })
        .from(storesTable)
        .where(eq(storesTable.id, storeId))
        .limit(1);
      if (!store) throw new AppError(storeErrors.STORE_NOT_FOUND);

      await db
        .insert(productStoreStatusTable)
        .values({ productId, storeId, status })
        .onDuplicateKeyUpdate({
          set: { status },
        });

      return {
        code: 0,
        data: null,
        message: status === 1 ? '已启用' : '已禁用',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeStatusErrors.UPDATE_PRODUCT_STATUS_FAILED);
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
      const [store] = await db
        .select({ id: storesTable.id })
        .from(storesTable)
        .where(eq(storesTable.id, storeId))
        .limit(1);
      if (!store) throw new AppError(storeErrors.STORE_NOT_FOUND);

      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(productCustomizationsTable);

      const total = Number(countResult[0]?.count ?? 0);

      const rows = await db
        .select({
          id: productCustomizationsTable.id,
          name: productCustomizationsTable.name,
          globalStatus: productCustomizationsTable.status,
          storeStatus: sql<number>`COALESCE(${customizationOptionStoreStatusTable.status}, 0)`,
          optionCount: sql<number>`(
            SELECT COUNT(*) FROM ${customizationOptionsTable}
            WHERE ${customizationOptionsTable.customizationId} = ${productCustomizationsTable.id}
          )`,
        })
        .from(productCustomizationsTable)
        .leftJoin(
          customizationOptionStoreStatusTable,
          and(
            eq(customizationOptionStoreStatusTable.customizationOptionId, productCustomizationsTable.id),
            eq(customizationOptionStoreStatusTable.storeId, storeId),
          ),
        )
        .limit(pageSize)
        .offset(offset)
        .orderBy(productCustomizationsTable.id);

      return {
        code: 0,
        data: { items: rows, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeStatusErrors.LIST_CUSTOMIZATIONS_FAILED);
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
      const [store] = await db
        .select({ id: storesTable.id })
        .from(storesTable)
        .where(eq(storesTable.id, storeId))
        .limit(1);
      if (!store) throw new AppError(storeErrors.STORE_NOT_FOUND);

      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(customizationOptionsTable)
        .where(eq(customizationOptionsTable.customizationId, customizationId));

      const total = Number(countResult[0]?.count ?? 0);

      const rows = await db
        .select({
          id: customizationOptionsTable.id,
          name: customizationOptionsTable.name,
          price: customizationOptionsTable.price,
          globalStatus: customizationOptionsTable.status,
          storeStatus: sql<number>`COALESCE(${customizationOptionStoreStatusTable.status}, 0)`,
        })
        .from(customizationOptionsTable)
        .leftJoin(
          customizationOptionStoreStatusTable,
          and(
            eq(customizationOptionStoreStatusTable.customizationOptionId, customizationOptionsTable.id),
            eq(customizationOptionStoreStatusTable.storeId, storeId),
          ),
        )
        .where(eq(customizationOptionsTable.customizationId, customizationId))
        .limit(pageSize)
        .offset(offset)
        .orderBy(customizationOptionsTable.sort, customizationOptionsTable.id);

      return {
        code: 0,
        data: { items: rows, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeStatusErrors.LIST_OPTIONS_FAILED);
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

      const [store] = await db
        .select({ id: storesTable.id })
        .from(storesTable)
        .where(eq(storesTable.id, storeId))
        .limit(1);
      if (!store) throw new AppError(storeErrors.STORE_NOT_FOUND);

      await db
        .insert(customizationOptionStoreStatusTable)
        .values({ customizationOptionId: optionId, storeId, status })
        .onDuplicateKeyUpdate({
          set: { status },
        });

      return {
        code: 0,
        data: null,
        message: status === 1 ? '已启用' : '已禁用',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeStatusErrors.UPDATE_OPTION_STATUS_FAILED);
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
      const [store] = await db
        .select({ id: storesTable.id })
        .from(storesTable)
        .where(eq(storesTable.id, storeId))
        .limit(1);
      if (!store) throw new AppError(storeErrors.STORE_NOT_FOUND);

      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(ingredientsTable);

      const total = Number(countResult[0]?.count ?? 0);

      const rows = await db
        .select({
          id: ingredientsTable.id,
          name: ingredientsTable.name,
          unit: ingredientsTable.unit,
          quantity: sql<number>`COALESCE(${storeInventoryTable.quantity}, 0)`,
        })
        .from(ingredientsTable)
        .leftJoin(
          storeInventoryTable,
          and(
            eq(storeInventoryTable.ingredientId, ingredientsTable.id),
            eq(storeInventoryTable.storeId, storeId),
          ),
        )
        .limit(pageSize)
        .offset(offset)
        .orderBy(ingredientsTable.id);

      return {
        code: 0,
        data: { items: rows, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(storeStatusErrors.LIST_INGREDIENTS_FAILED);
    }
  });
}
