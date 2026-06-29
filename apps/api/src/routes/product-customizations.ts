import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import {
  productCustomizationsTable,
  productsTable,
  customizationOptionsTable,
  ingredientsTable,
} from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import { productCustomizationErrors } from '../errorcode/product-customizations.js';
import { parsePositiveInt, validateMaxLength } from '../utils/validation.js';
import type {
  ApiResponse,
  PaginatedData,
  ProductCustomization,
  CreateProductCustomizationInput,
  UpdateProductCustomizationInput,
  ProductCustomizationQuery,
  CustomizationOption,
  CreateCustomizationOptionInput,
  UpdateCustomizationOptionInput,
} from '@dextea/shared-types';

export async function productCustomizationRoutes(app: FastifyInstance) {
  /** 客制化项目列表 */
  app.get<{
    Querystring: ProductCustomizationQuery;
    Reply: ApiResponse<PaginatedData<ProductCustomization>>;
  }>('/product-customizations', {
    schema: {
      description: '客制化项目列表',
      tags: ['Product Customizations'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码' },
          pageSize: { type: 'string', description: '每页数量' },
          keyword: { type: 'string', description: '搜索关键词（名称）' },
          status: { type: 'string', description: '状态筛选 0=下架 1=启用' },
          productId: { type: 'string', description: '商品ID筛选' },
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
                      productId: { type: 'integer', description: '关联商品ID' },
                      name: { type: 'string' },

                      status: { type: 'integer', description: '0=下架 1=启用' },
                      optionCount: { type: 'integer', description: '选项数' },
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
      const keyword = request.query.keyword;
      const status = request.query.status;
      const productId = request.query.productId;

      const conditions: ReturnType<typeof sql>[] = [];
      if (keyword) {
        const pattern = `%${keyword}%`;
        conditions.push(sql`${productCustomizationsTable.name} like ${pattern}`);
      }
      if (status !== undefined && status !== '') {
        conditions.push(eq(productCustomizationsTable.status, parseInt(status, 10)));
      }
      if (productId !== undefined && productId !== '') {
        conditions.push(eq(productCustomizationsTable.productId, parseInt(productId, 10)));
      }

      const whereClause = conditions.length > 0
        ? sql`${conditions.reduce((acc, c) => sql`${acc} and ${c}`)}`
        : undefined;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(productCustomizationsTable)
        .where(whereClause);

      const total = Number(countResult[0]?.count ?? 0);

      const items = await db
        .select({
          id: productCustomizationsTable.id,
          productId: productCustomizationsTable.productId,
          name: productCustomizationsTable.name,
          status: productCustomizationsTable.status,
          optionCount: sql<number>`(select count(*) from ${customizationOptionsTable} where ${customizationOptionsTable.customizationId} = ${productCustomizationsTable.id})`,
          createdAt: productCustomizationsTable.createdAt,
          updatedAt: productCustomizationsTable.updatedAt,
        })
        .from(productCustomizationsTable)
        .where(whereClause)
        .orderBy(productCustomizationsTable.id)
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
      throw new AppError(productCustomizationErrors.LIST_FAILED);
    }
  });

  /** 客制化项目详情 */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<ProductCustomization>;
  }>('/product-customizations/:id', {
    schema: {
      description: '客制化项目详情',
      tags: ['Product Customizations'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '客制化项目ID' },
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
                      productId: { type: 'integer', description: '关联商品ID' },
                      name: { type: 'string' },

                      status: { type: 'integer', description: '0=下架 1=启用' },
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
  }, async (request) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '客制化项目ID');

      const [item] = await db
        .select()
        .from(productCustomizationsTable)
        .where(eq(productCustomizationsTable.id, id))
        .limit(1);

      if (!item) {
        throw new AppError(productCustomizationErrors.NOT_FOUND);
      }

      return {
        code: 0,
        data: item,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productCustomizationErrors.LIST_FAILED);
    }
  });

  /** 创建客制化项目 */
  app.post<{
    Body: CreateProductCustomizationInput;
    Reply: ApiResponse<ProductCustomization>;
  }>('/product-customizations', {
    schema: {
      description: '创建客制化项目',
      tags: ['Product Customizations'],
      body: {
        type: 'object',
        properties: {
          productId: { type: 'integer', description: '商品ID' },
          name: { type: 'string', minLength: 1, description: '客制化项目名称' },
        },
        required: ['productId', 'name'],
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
                      productId: { type: 'integer', description: '关联商品ID' },
                      name: { type: 'string' },

                      status: { type: 'integer', description: '0=下架 1=启用' },
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
  }, async (request) => {
    try {
      const db = await getDb();
      const { productId, name } = request.body;

      // 检查商品是否存在
      const [product] = await db
        .select({ id: productsTable.id })
        .from(productsTable)
        .where(eq(productsTable.id, productId))
        .limit(1);

      if (!product) {
        throw new AppError(productCustomizationErrors.PRODUCT_NOT_FOUND);
      }

      const trimmedName = name.trim();
      validateMaxLength(trimmedName, 255, '客制化项目名称');

      const result = await db.insert(productCustomizationsTable).values({
        productId,
        name: trimmedName,
      });

      const insertId = Number(result[0]?.insertId ?? 0);

      const [created] = await db
        .select()
        .from(productCustomizationsTable)
        .where(eq(productCustomizationsTable.id, insertId))
        .limit(1);

      return {
        code: 0,
        data: created,
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productCustomizationErrors.CREATE_FAILED);
    }
  });



  /** 更新客制化项目基础信息 */
  app.patch<{
    Params: { id: string };
    Body: UpdateProductCustomizationInput;
    Reply: ApiResponse<ProductCustomization>;
  }>('/product-customizations/:id', {
    schema: {
      description: '更新客制化项目基础信息',
      tags: ['Product Customizations'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '客制化项目ID' },
        },
        required: ['id'],
      },
      body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, description: '客制化项目名称' },
            status: { type: 'integer', description: '0=下架 1=启用' },
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
                  productId: { type: 'integer', description: '关联商品ID' },
                  name: { type: 'string' },
                  status: { type: 'integer' },
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
  }, async (request) => {
    try {
      const db = await getDb();
      const id = parsePositiveInt(request.params.id, '客制化项目ID');
      const { name, status } = request.body;

      const trimmedName = name.trim();
      validateMaxLength(trimmedName, 255, '客制化项目名称');

      const [existing] = await db
        .select()
        .from(productCustomizationsTable)
        .where(eq(productCustomizationsTable.id, id))
        .limit(1);

      if (!existing) {
        throw new AppError(productCustomizationErrors.NOT_FOUND);
      }

      const updateData: Record<string, unknown> = {
        name: trimmedName,
      };
      if (status !== undefined) updateData.status = status;

      await db
        .update(productCustomizationsTable)
        .set(updateData)
        .where(eq(productCustomizationsTable.id, id));

      const [updated] = await db
        .select()
        .from(productCustomizationsTable)
        .where(eq(productCustomizationsTable.id, id))
        .limit(1);

      return {
        code: 0,
        data: updated,
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productCustomizationErrors.UPDATE_FAILED);
    }
  });

  /** 获取客制化选项列表 */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<CustomizationOption[]>;
  }>('/product-customizations/:id/options', {
    schema: {
      description: '获取客制化选项列表',
      tags: ['Product Customizations'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '客制化项目ID' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  customizationId: { type: 'integer' },
                  name: { type: 'string' },
                  price: { type: 'number' },
                  sort: { type: 'integer' },
                  status: { type: 'integer' },
                  ingredientId: { type: 'integer', nullable: true },
                  ingredientName: { type: 'string' },
                  quantity: { type: 'number' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
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
      const customizationId = parsePositiveInt(request.params.id, '客制化项目ID');

      const options = await db
        .select({
          id: customizationOptionsTable.id,
          customizationId: customizationOptionsTable.customizationId,
          name: customizationOptionsTable.name,
          price: customizationOptionsTable.price,
          sort: customizationOptionsTable.sort,
          status: customizationOptionsTable.status,
          ingredientId: customizationOptionsTable.ingredientId,
          ingredientName: sql<string>`coalesce(${ingredientsTable.name}, '')`,
          quantity: customizationOptionsTable.quantity,
          createdAt: customizationOptionsTable.createdAt,
          updatedAt: customizationOptionsTable.updatedAt,
        })
        .from(customizationOptionsTable)
        .leftJoin(ingredientsTable, eq(customizationOptionsTable.ingredientId, ingredientsTable.id))
        .where(eq(customizationOptionsTable.customizationId, customizationId))
        .orderBy(customizationOptionsTable.sort, customizationOptionsTable.id);

      return {
        code: 0,
        data: options,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productCustomizationErrors.OPTIONS_LIST_FAILED);
    }
  });

  /** 创建客制化选项 */
  app.post<{
    Params: { id: string };
    Body: CreateCustomizationOptionInput;
    Reply: ApiResponse<CustomizationOption>;
  }>('/product-customizations/:id/options', {
    schema: {
      description: '创建客制化选项',
      tags: ['Product Customizations'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '客制化项目ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          price: { type: 'number' },
          sort: { type: 'integer' },
          ingredientId: { type: 'integer', nullable: true },
          quantity: { type: 'number' },
        },
        required: ['name'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                customizationId: { type: 'integer' },
                name: { type: 'string' },
                price: { type: 'number' },
                sort: { type: 'integer' },
                status: { type: 'integer' },
                ingredientId: { type: 'integer', nullable: true },
                quantity: { type: 'number' },
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
  }, async (request) => {
    try {
      const db = await getDb();
      const customizationId = parsePositiveInt(request.params.id, '客制化项目ID');
      const { name, price, sort, ingredientId, quantity } = request.body;

      const trimmedName = name.trim();
      validateMaxLength(trimmedName, 255, '客制化选项名称');

      if (ingredientId != null) {
        const [ingredient] = await db
          .select({ id: ingredientsTable.id })
          .from(ingredientsTable)
          .where(eq(ingredientsTable.id, ingredientId))
          .limit(1);
        if (!ingredient) {
          throw new AppError(productCustomizationErrors.INGREDIENT_NOT_FOUND);
        }
      }

      const result = await db.insert(customizationOptionsTable).values({
        customizationId,
        name: trimmedName,
        price: price ?? 0,
        sort: sort ?? 0,
        ingredientId: ingredientId ?? null,
        quantity: quantity ?? 0,
      });

      const insertId = Number(result[0]?.insertId ?? 0);

      const [created] = await db
        .select({
          id: customizationOptionsTable.id,
          customizationId: customizationOptionsTable.customizationId,
          name: customizationOptionsTable.name,
          price: customizationOptionsTable.price,
          sort: customizationOptionsTable.sort,
          status: customizationOptionsTable.status,
          ingredientId: customizationOptionsTable.ingredientId,
          ingredientName: sql<string>`coalesce(${ingredientsTable.name}, '')`,
          quantity: customizationOptionsTable.quantity,
          createdAt: customizationOptionsTable.createdAt,
          updatedAt: customizationOptionsTable.updatedAt,
        })
        .from(customizationOptionsTable)
        .leftJoin(ingredientsTable, eq(customizationOptionsTable.ingredientId, ingredientsTable.id))
        .where(eq(customizationOptionsTable.id, insertId))
        .limit(1);

      return {
        code: 0,
        data: created,
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productCustomizationErrors.OPTION_CREATE_FAILED);
    }
  });

  /** 更新客制化选项 */
  app.put<{
    Params: { id: string; optionId: string };
    Body: UpdateCustomizationOptionInput;
    Reply: ApiResponse<CustomizationOption>;
  }>('/product-customizations/:id/options/:optionId', {
    schema: {
      description: '更新客制化选项',
      tags: ['Product Customizations'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '客制化项目ID' },
          optionId: { type: 'string', minLength: 1, description: '客制化选项ID' },
        },
        required: ['id', 'optionId'],
      },
      body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            price: { type: 'number' },
            sort: { type: 'integer' },
            status: { type: 'integer' },
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
                  id: { type: 'integer' },
                  customizationId: { type: 'integer' },
                  name: { type: 'string' },
                  price: { type: 'number' },
                  sort: { type: 'integer' },
                  status: { type: 'integer' },
                  ingredientId: { type: 'integer', nullable: true },
                  quantity: { type: 'number' },
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
  }, async (request) => {
    try {
      const db = await getDb();
      const customizationId = parsePositiveInt(request.params.id, '客制化项目ID');
      const optionId = parsePositiveInt(request.params.optionId, '客制化选项ID');
      const { name, price, sort, status } = request.body;

      const [existing] = await db
        .select()
        .from(customizationOptionsTable)
        .where(eq(customizationOptionsTable.id, optionId))
        .limit(1);

      if (!existing || existing.customizationId !== customizationId) {
        throw new AppError(productCustomizationErrors.OPTION_NOT_FOUND);
      }

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) {
        const trimmedName = name.trim();
        validateMaxLength(trimmedName, 255, '客制化选项名称');
        updateData.name = trimmedName;
      }
      if (price !== undefined) updateData.price = price;
      if (sort !== undefined) updateData.sort = sort;
      if (status !== undefined) updateData.status = status;

      await db
        .update(customizationOptionsTable)
        .set(updateData)
        .where(eq(customizationOptionsTable.id, optionId));

      const [updated] = await db
        .select({
          id: customizationOptionsTable.id,
          customizationId: customizationOptionsTable.customizationId,
          name: customizationOptionsTable.name,
          price: customizationOptionsTable.price,
          sort: customizationOptionsTable.sort,
          status: customizationOptionsTable.status,
          ingredientId: customizationOptionsTable.ingredientId,
          ingredientName: sql<string>`coalesce(${ingredientsTable.name}, '')`,
          quantity: customizationOptionsTable.quantity,
          createdAt: customizationOptionsTable.createdAt,
          updatedAt: customizationOptionsTable.updatedAt,
        })
        .from(customizationOptionsTable)
        .leftJoin(ingredientsTable, eq(customizationOptionsTable.ingredientId, ingredientsTable.id))
        .where(eq(customizationOptionsTable.id, optionId))
        .limit(1);

      return {
        code: 0,
        data: updated,
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productCustomizationErrors.OPTION_UPDATE_FAILED);
    }
  });

  /** 删除客制化选项 */
  app.delete<{
    Params: { id: string; optionId: string };
    Reply: ApiResponse<null>;
  }>('/product-customizations/:id/options/:optionId', {
    schema: {
      description: '删除客制化选项',
      tags: ['Product Customizations'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '客制化项目ID' },
          optionId: { type: 'string', minLength: 1, description: '客制化选项ID' },
        },
        required: ['id', 'optionId'],
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
      const customizationId = parsePositiveInt(request.params.id, '客制化项目ID');
      const optionId = parsePositiveInt(request.params.optionId, '客制化选项ID');

      const [existing] = await db
        .select()
        .from(customizationOptionsTable)
        .where(eq(customizationOptionsTable.id, optionId))
        .limit(1);

      if (!existing || existing.customizationId !== customizationId) {
        throw new AppError(productCustomizationErrors.OPTION_NOT_FOUND);
      }

      await db
        .delete(customizationOptionsTable)
        .where(eq(customizationOptionsTable.id, optionId));

      return {
        code: 0,
        data: null,
        message: '删除成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productCustomizationErrors.OPTION_DELETE_FAILED);
    }
  });
}
