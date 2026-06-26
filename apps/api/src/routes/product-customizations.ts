import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import {
  productCustomizationsTable,
  productCustomizationRelationsTable,
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
          keyword: { type: 'string', description: '搜索关键词（名称/展示名称）' },
          status: { type: 'string', description: '状态筛选 0=下架 1=启用' },
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
                      displayName: { type: 'string' },
                      status: { type: 'integer', description: '0=下架 1=启用' },
                      boundCount: { type: 'integer', description: '绑定项目数' },
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

      const conditions: ReturnType<typeof sql>[] = [];
      if (keyword) {
        const pattern = `%${keyword}%`;
        conditions.push(sql`(${productCustomizationsTable.name} like ${pattern} or ${productCustomizationsTable.displayName} like ${pattern})`);
      }
      if (status !== undefined && status !== '') {
        conditions.push(eq(productCustomizationsTable.status, parseInt(status, 10)));
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
          name: productCustomizationsTable.name,
          displayName: productCustomizationsTable.displayName,
          status: productCustomizationsTable.status,
          boundCount: sql<number>`(select count(*) from ${productCustomizationRelationsTable} where ${productCustomizationRelationsTable.customizationId} = ${productCustomizationsTable.id})`,
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
                name: { type: 'string' },
                displayName: { type: 'string' },
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
          name: { type: 'string', minLength: 1, description: '客制化项目名称' },
          displayName: { type: 'string', minLength: 1, description: '展示名称' },
        },
        required: ['name', 'displayName'],
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
                displayName: { type: 'string' },
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
      const { name, displayName } = request.body;

      const trimmedName = name.trim();
      const trimmedDisplayName = displayName.trim();
      validateMaxLength(trimmedName, 255, '客制化项目名称');
      validateMaxLength(trimmedDisplayName, 255, '展示名称');

      const result = await db.insert(productCustomizationsTable).values({
        name: trimmedName,
        displayName: trimmedDisplayName,
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

  /** 获取绑定的商品列表 */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<{ productId: number; productName: string }[]>;
  }>('/product-customizations/:id/products', {
    schema: {
      description: '获取绑定的商品列表',
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
              type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    productId: { type: 'integer' },
                    productName: { type: 'string' },
                    sort: { type: 'integer' },
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

      const rows = await db
        .select({
          productId: productCustomizationRelationsTable.productId,
          productName: productsTable.name,
          sort: productCustomizationRelationsTable.sort,
        })
        .from(productCustomizationRelationsTable)
        .innerJoin(productsTable, eq(productCustomizationRelationsTable.productId, productsTable.id))
        .where(eq(productCustomizationRelationsTable.customizationId, customizationId))
        .orderBy(productCustomizationRelationsTable.sort, productCustomizationRelationsTable.productId);

      return {
        code: 0,
        data: rows,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productCustomizationErrors.BIND_LIST_FAILED);
    }
  });

  /** 绑定商品到客制化项目 */
  app.post<{
    Params: { id: string };
    Body: { productId: number; sort?: number };
    Reply: ApiResponse<null>;
  }>('/product-customizations/:id/products', {
    schema: {
      description: '绑定商品到客制化项目',
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
          productId: { type: 'integer', description: '商品ID' },
          sort: { type: 'integer', description: '排序序号' },
        },
        required: ['productId'],
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
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const customizationId = parsePositiveInt(request.params.id, '客制化项目ID');
      const { productId, sort } = request.body;

      // 检查商品是否存在
      const [product] = await db
        .select({ id: productsTable.id })
        .from(productsTable)
        .where(eq(productsTable.id, productId))
        .limit(1);

      if (!product) {
        throw new AppError(productCustomizationErrors.PRODUCT_NOT_FOUND);
      }

      // 检查是否已绑定
      const [existing] = await db
        .select()
        .from(productCustomizationRelationsTable)
        .where(
          sql`${productCustomizationRelationsTable.productId} = ${productId} and ${productCustomizationRelationsTable.customizationId} = ${customizationId}`,
        )
        .limit(1);

      if (existing) {
        throw new AppError(productCustomizationErrors.PRODUCT_ALREADY_BOUND);
      }

      await db.insert(productCustomizationRelationsTable).values({ productId, customizationId, sort: sort ?? 0 });

      return {
        code: 0,
        data: null,
        message: '绑定成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productCustomizationErrors.BIND_FAILED);
    }
  });

  /** 更新商品绑定排序 */
  app.patch<{
    Params: { id: string; productId: string };
    Body: { sort: number };
    Reply: ApiResponse<null>;
  }>('/product-customizations/:id/products/:productId/sort', {
    schema: {
      description: '更新商品绑定排序',
      tags: ['Product Customizations'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '客制化项目ID' },
          productId: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id', 'productId'],
      },
      body: {
        type: 'object',
        properties: {
          sort: { type: 'integer', description: '排序序号' },
        },
        required: ['sort'],
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
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const customizationId = parsePositiveInt(request.params.id, '客制化项目ID');
      const productId = parsePositiveInt(request.params.productId, '商品ID');
      const { sort } = request.body;

      const [existing] = await db
        .select()
        .from(productCustomizationRelationsTable)
        .where(
          sql`${productCustomizationRelationsTable.productId} = ${productId} and ${productCustomizationRelationsTable.customizationId} = ${customizationId}`,
        )
        .limit(1);

      if (!existing) {
        throw new AppError(productCustomizationErrors.BIND_NOT_FOUND);
      }

      await db
        .update(productCustomizationRelationsTable)
        .set({ sort })
        .where(
          sql`${productCustomizationRelationsTable.productId} = ${productId} and ${productCustomizationRelationsTable.customizationId} = ${customizationId}`,
        );

      return {
        code: 0,
        data: null,
        message: '更新排序成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productCustomizationErrors.BIND_SORT_UPDATE_FAILED);
    }
  });

  /** 解绑商品 */
  app.delete<{
    Params: { id: string; productId: string };
    Reply: ApiResponse<null>;
  }>('/product-customizations/:id/products/:productId', {
    schema: {
      description: '解绑商品',
      tags: ['Product Customizations'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '客制化项目ID' },
          productId: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id', 'productId'],
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
      security: [{ bearerAuth: [] }],
    },
  }, async (request) => {
    try {
      const db = await getDb();
      const customizationId = parsePositiveInt(request.params.id, '客制化项目ID');
      const productId = parsePositiveInt(request.params.productId, '商品ID');

      await db
        .delete(productCustomizationRelationsTable)
        .where(
          sql`${productCustomizationRelationsTable.productId} = ${productId} and ${productCustomizationRelationsTable.customizationId} = ${customizationId}`,
        );

      return {
        code: 0,
        data: null,
        message: '解绑成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(productCustomizationErrors.UNBIND_FAILED);
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
            displayName: { type: 'string', minLength: 1, description: '展示名称' },
            status: { type: 'integer', description: '0=下架 1=启用' },
          },
          required: ['name', 'displayName'],
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
                  displayName: { type: 'string' },
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
      const { name, displayName, status } = request.body;

      const trimmedName = name.trim();
      const trimmedDisplayName = displayName.trim();
      validateMaxLength(trimmedName, 255, '客制化项目名称');
      validateMaxLength(trimmedDisplayName, 255, '展示名称');

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
        displayName: trimmedDisplayName,
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
