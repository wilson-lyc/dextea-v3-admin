import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { productTagsTable, productTagRelationsTable, productsTable } from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import { tagErrors } from '../errorcode/tags.js';
import { productErrors } from '../errorcode/products.js';
import { parsePositiveInt, validateMaxLength } from '../utils/validation.js';
import type {
  ApiResponse,
  PaginatedData,
  ProductTag,
  CreateTagInput,
  UpdateTagInput,
  TagQuery,
} from '@dextea/shared-types';

export async function tagRoutes(app: FastifyInstance) {
  /** 商品标签列表 */
  app.get<{
    Querystring: TagQuery;
    Reply: ApiResponse<PaginatedData<ProductTag>>;
  }>('/tags', {
    schema: {
      description: '获取商品标签列表',
      tags: ['Tags'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码' },
          pageSize: { type: 'string', description: '每页数量' },
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
                      boundCount: { type: 'integer', description: '绑定的商品数量' },
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
  }, async (request) => {
    try {
      const db = await getDb();
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(productTagsTable);

      const total = Number(countResult[0]?.count ?? 0);

      const items = await db
        .select({
          id: productTagsTable.id,
          name: productTagsTable.name,
          boundCount: sql<number>`(select count(*) from ${productTagRelationsTable} where ${productTagRelationsTable.tagId} = ${productTagsTable.id})`,
          createdAt: productTagsTable.createdAt,
          updatedAt: productTagsTable.updatedAt,
        })
        .from(productTagsTable)
        .orderBy(productTagsTable.id)
        .limit(pageSize)
        .offset(offset);

      return {
        code: 0,
        data: { items, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(tagErrors.LIST_FAILED);
    }
  });

  /** 新增商品标签 */
  app.post<{
    Body: CreateTagInput;
    Reply: ApiResponse<ProductTag>;
  }>('/tags', {
    schema: {
      description: '新增商品标签',
      tags: ['Tags'],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: '标签名称' },
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
                name: { type: 'string' },
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
      const { name } = request.body;

      const trimmedName = name.trim();
      validateMaxLength(trimmedName, 255, '标签名称');

      // 检查名称重复
      const [existing] = await db
        .select()
        .from(productTagsTable)
        .where(eq(productTagsTable.name, trimmedName))
        .limit(1);

      if (existing) {
        throw new AppError(tagErrors.DUPLICATE_NAME);
      }

      const result = await db
        .insert(productTagsTable)
        .values({ name: trimmedName });

      const insertId = Number(result[0]?.insertId ?? 0);

      return {
        code: 0,
        data: { id: insertId, name: trimmedName },
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(tagErrors.CREATE_FAILED);
    }
  });

  /** 更新商品标签 */
  app.put<{
    Params: { id: string };
    Body: UpdateTagInput;
    Reply: ApiResponse<ProductTag>;
  }>('/tags/:id', {
    schema: {
      description: '更新商品标签',
      tags: ['Tags'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '标签ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: '标签名称' },
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
                name: { type: 'string' },
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
      const id = parsePositiveInt(request.params.id, '标签ID');

      const { name } = request.body;

      const trimmedName = name.trim();
      validateMaxLength(trimmedName, 255, '标签名称');

      // 检查标签是否存在
      const [tag] = await db
        .select()
        .from(productTagsTable)
        .where(eq(productTagsTable.id, id))
        .limit(1);

      if (!tag) {
        throw new AppError(tagErrors.TAG_NOT_FOUND);
      }

      // 检查名称重复（排除自身）
      const [duplicate] = await db
        .select()
        .from(productTagsTable)
        .where(eq(productTagsTable.name, trimmedName))
        .limit(1);

      if (duplicate && duplicate.id !== id) {
        throw new AppError(tagErrors.DUPLICATE_NAME);
      }

      await db
        .update(productTagsTable)
        .set({ name: trimmedName })
        .where(eq(productTagsTable.id, id));

      return {
        code: 0,
        data: { id, name: trimmedName },
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(tagErrors.UPDATE_FAILED);
    }
  });

  /** 获取标签绑定的商品列表 */
  app.get<{
    Params: { id: string };
    Querystring: { page?: string; pageSize?: string };
    Reply: ApiResponse<PaginatedData<{ id: number; name: string }>>;
  }>('/tags/:id/products', {
    schema: {
      description: '获取标签绑定的商品列表',
      tags: ['Tags'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '标签ID' },
        },
        required: ['id'],
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码' },
          pageSize: { type: 'string', description: '每页数量' },
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
      const id = parsePositiveInt(request.params.id, '标签ID');
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const baseQuery = db
        .select({
          id: productsTable.id,
          name: productsTable.name,
        })
        .from(productTagRelationsTable)
        .innerJoin(productsTable, eq(productTagRelationsTable.productId, productsTable.id))
        .where(eq(productTagRelationsTable.tagId, id));

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(productTagRelationsTable)
        .where(eq(productTagRelationsTable.tagId, id));

      const total = Number(countResult?.count ?? 0);

      const items = await baseQuery
        .orderBy(productsTable.id)
        .limit(pageSize)
        .offset(offset);

      return {
        code: 0,
        data: { items, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(tagErrors.LIST_FAILED);
    }
  });

  /** 绑定商品到标签 */
  app.post<{
    Params: { id: string };
    Body: { productId: number };
    Reply: ApiResponse<null>;
  }>('/tags/:id/products', {
    schema: {
      description: '绑定商品到标签',
      tags: ['Tags'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '标签ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          productId: { type: 'integer', description: '商品ID' },
        },
        required: ['productId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: { type: 'null', description: 'null' },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '标签ID');
      const { productId } = request.body;

      // 检查标签是否存在
      const [tag] = await db
        .select()
        .from(productTagsTable)
        .where(eq(productTagsTable.id, id))
        .limit(1);

      if (!tag) {
        throw new AppError(tagErrors.TAG_NOT_FOUND);
      }

      // 检查商品是否存在
      const [product] = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, productId))
        .limit(1);

      if (!product) {
        throw new AppError(productErrors.PRODUCT_NOT_FOUND);
      }

      // 检查绑定是否已存在
      const [existing] = await db
        .select()
        .from(productTagRelationsTable)
        .where(
          sql`${productTagRelationsTable.productId} = ${productId} and ${productTagRelationsTable.tagId} = ${id}`,
        )
        .limit(1);

      if (existing) {
        throw new AppError(tagErrors.PRODUCT_ALREADY_BOUND);
      }

      // 插入绑定关系
      await db
        .insert(productTagRelationsTable)
        .values({ productId, tagId: id });

      return {
        code: 0,
        data: null,
        message: '绑定成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(tagErrors.BIND_FAILED);
    }
  });

  /** 解绑商品标签 */
  app.delete<{
    Params: { id: string; productId: string };
    Reply: ApiResponse<null>;
  }>('/tags/:id/products/:productId', {
    schema: {
      description: '解绑商品与标签的关联',
      tags: ['Tags'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '标签ID' },
          productId: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id', 'productId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: { type: 'null', description: 'null' },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '标签ID');
      const productId = parsePositiveInt(request.params.productId, '商品ID');

      await db
        .delete(productTagRelationsTable)
        .where(
          sql`${productTagRelationsTable.productId} = ${productId} and ${productTagRelationsTable.tagId} = ${id}`,
        );

      return {
        code: 0,
        data: null,
        message: '解绑成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(tagErrors.UNBIND_FAILED);
    }
  });

  /** 删除商品标签 */
  app.delete<{
    Params: { id: string };
    Reply: ApiResponse<null>;
  }>('/tags/:id', {
    schema: {
      description: '删除商品标签',
      tags: ['Tags'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '标签ID' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: { type: 'null', description: 'null' },
            message: { type: 'string' },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '标签ID');

      // 检查标签是否存在
      const [tag] = await db
        .select()
        .from(productTagsTable)
        .where(eq(productTagsTable.id, id))
        .limit(1);

      if (!tag) {
        throw new AppError(tagErrors.TAG_NOT_FOUND);
      }

      // 同步删除商品与标签的绑定关系
      await db
        .delete(productTagRelationsTable)
        .where(eq(productTagRelationsTable.tagId, id));

      await db
        .delete(productTagsTable)
        .where(eq(productTagsTable.id, id));

      return {
        code: 0,
        data: null,
        message: '删除成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(tagErrors.DELETE_FAILED);
    }
  });
}
