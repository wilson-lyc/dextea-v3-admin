import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { ingredientsTable, productsTable, productIngredientRelationsTable, customizationOptionsTable, productCustomizationsTable } from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import { ingredientErrors } from '../errorcode/ingredients.js';
import { parsePositiveInt, validateMaxLength, validateStatus } from '../utils/validation.js';
import type {
  ApiResponse,
  PaginatedData,
  Ingredient,
  IngredientQuery,
  CreateIngredientInput,
  CreateIngredientResponse,
  UpdateIngredientInput,
  UpdateIngredientResponse,
} from '@dextea/shared-types';
import { INGREDIENT_STATUS_VALUES } from '@dextea/shared-types';


export async function ingredientRoutes(app: FastifyInstance) {
  /** 原料列表 */
  app.get<{
    Querystring: IngredientQuery;
    Reply: ApiResponse<PaginatedData<Ingredient>>;
  }>('/ingredients', {
    schema: {
      description: '原料列表',
      tags: ['Ingredients'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码' },
          pageSize: { type: 'string', description: '每页数量' },
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
                      unit: { type: 'string' },
                      status: { type: 'integer', description: '0=下架 1=启用' },
                      boundCount: { type: 'integer', description: '商品绑定数' },
                      optionCount: { type: 'integer', description: '客制化选项绑定数' },
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

      let query = db
        .select({
          id: ingredientsTable.id,
          name: ingredientsTable.name,
          unit: ingredientsTable.unit,
          status: ingredientsTable.status,
          boundCount: sql<number>`(select count(*) from ${productIngredientRelationsTable} where ${productIngredientRelationsTable.ingredientId} = ${ingredientsTable.id})`,
          optionCount: sql<number>`(select count(*) from ${customizationOptionsTable} where ${customizationOptionsTable.ingredientId} = ${ingredientsTable.id})`,
          createdAt: ingredientsTable.createdAt,
          updatedAt: ingredientsTable.updatedAt,
        })
        .from(ingredientsTable)
        .$dynamic();

      let countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(ingredientsTable)
        .$dynamic();

      if (keyword) {
        const pattern = `%${keyword}%`;
        const filter = sql`${ingredientsTable.name} like ${pattern}`;
        query = query.where(filter);
        countQuery = countQuery.where(filter);
      }

      const items = await query
        .limit(pageSize)
        .offset(offset)
        .orderBy(ingredientsTable.id);

      const countResult = await countQuery;
      const total = Number(countResult[0]?.count ?? 0);

      return {
        code: 0,
        data: { items, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.LIST_FAILED);
    }
  });

  /** 新增原料 */
  app.post<{
    Body: CreateIngredientInput;
    Reply: ApiResponse<CreateIngredientResponse>;
  }>('/ingredients', {
    schema: {
      description: '新增原料',
      tags: ['Ingredients'],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: '原料名称' },
          unit: { type: 'string', minLength: 1, description: '单位' },
          status: { type: 'integer', description: '0=下架 1=启用' },
        },
        required: ['name', 'unit'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer', description: '原料ID' },
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
      const { name, unit, status } = request.body;

      if (!name) throw new AppError(ingredientErrors.NAME_REQUIRED);
      if (!unit) throw new AppError(ingredientErrors.UNIT_REQUIRED);

      validateMaxLength(name, 255, '原料名称');
      validateMaxLength(unit, 50, '单位');

      if (status !== undefined) {
        validateStatus(status, INGREDIENT_STATUS_VALUES, '原料状态');
      }

      const result = await db.insert(ingredientsTable).values({
        name,
        unit,
        status: status ?? 0,
      });

      const insertId = Number(result[0]?.insertId ?? 0);

      return {
        code: 0,
        data: { id: insertId },
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.CREATE_FAILED);
    }
  });

  /** 原料详情 */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<Ingredient>;
  }>('/ingredients/:id', {
    schema: {
      description: '原料详情',
      tags: ['Ingredients'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '原料ID' },
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
                unit: { type: 'string' },
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
      const id = parsePositiveInt(request.params.id, '原料ID');

      const [ingredient] = await db
        .select()
        .from(ingredientsTable)
        .where(eq(ingredientsTable.id, id))
        .limit(1);

      if (!ingredient) {
        throw new AppError(ingredientErrors.INGREDIENT_NOT_FOUND);
      }

      return {
        code: 0,
        data: ingredient as Ingredient,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.LIST_FAILED);
    }
  });

  /** 更新原料 */
  app.put<{
    Params: { id: string };
    Body: UpdateIngredientInput;
    Reply: ApiResponse<UpdateIngredientResponse>;
  }>('/ingredients/:id', {
    schema: {
      description: '更新原料',
      tags: ['Ingredients'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '原料ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '原料名称' },
          unit: { type: 'string', description: '单位' },
          status: { type: 'integer', description: '0=下架 1=启用' },
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
                id: { type: 'integer', description: '原料ID' },
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
      const id = parsePositiveInt(request.params.id, '原料ID');
      const { name, unit, status } = request.body;

      const [ingredient] = await db
        .select()
        .from(ingredientsTable)
        .where(eq(ingredientsTable.id, id))
        .limit(1);

      if (!ingredient) {
        throw new AppError(ingredientErrors.INGREDIENT_NOT_FOUND);
      }

      if (name !== undefined) {
        if (!name) throw new AppError(ingredientErrors.NAME_REQUIRED);
        validateMaxLength(name, 255, '原料名称');
      }
      if (unit !== undefined) {
        if (!unit) throw new AppError(ingredientErrors.UNIT_REQUIRED);
        validateMaxLength(unit, 50, '单位');
      }
      if (status !== undefined) {
        validateStatus(status, INGREDIENT_STATUS_VALUES, '原料状态');
      }

      const updateData: Partial<typeof ingredientsTable.$inferInsert> = {};
      if (name !== undefined) updateData.name = name;
      if (unit !== undefined) updateData.unit = unit;
      if (status !== undefined) updateData.status = status;

      if (Object.keys(updateData).length > 0) {
        await db
          .update(ingredientsTable)
          .set(updateData)
          .where(eq(ingredientsTable.id, id));
      }

      return {
        code: 0,
        data: { id },
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.UPDATE_FAILED);
    }
  });

  /** 更新原料状态 */
  app.patch<{
    Params: { id: string };
    Body: { status: number };
    Reply: ApiResponse<Ingredient>;
  }>('/ingredients/:id/status', {
    schema: {
      description: '更新原料状态',
      tags: ['Ingredients'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '原料ID' },
        },
        required: ['id'],
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
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                unit: { type: 'string' },
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
      const id = parsePositiveInt(request.params.id, '原料ID');
      const { status } = request.body;

      const [ingredient] = await db
        .select()
        .from(ingredientsTable)
        .where(eq(ingredientsTable.id, id))
        .limit(1);

      if (!ingredient) {
        throw new AppError(ingredientErrors.INGREDIENT_NOT_FOUND);
      }

      validateStatus(status, INGREDIENT_STATUS_VALUES, '原料状态');

      await db
        .update(ingredientsTable)
        .set({ status })
        .where(eq(ingredientsTable.id, id));

      const [updated] = await db
        .select()
        .from(ingredientsTable)
        .where(eq(ingredientsTable.id, id))
        .limit(1);

      return {
        code: 0,
        data: updated as Ingredient,
        message: '更新状态成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.STATUS_UPDATE_FAILED);
    }
  });

  /** 获取绑定商品列表 */
  app.get<{
    Querystring: { page?: string; pageSize?: string };
    Params: { id: string };
    Reply: ApiResponse<PaginatedData<{ productId: number; productName: string; quantity: number }>>;
  }>('/ingredients/:id/products', {
    schema: {
      description: '获取绑定商品列表',
      tags: ['Ingredients'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '原料ID' },
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
            code: { type: 'integer' },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      productId: { type: 'integer' },
                      productName: { type: 'string' },
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
      const ingredientId = parsePositiveInt(request.params.id, '原料ID');
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const rows = await db
        .select({
          productId: productIngredientRelationsTable.productId,
          productName: productsTable.name,
          quantity: productIngredientRelationsTable.quantity,
        })
        .from(productIngredientRelationsTable)
        .innerJoin(productsTable, eq(productIngredientRelationsTable.productId, productsTable.id))
        .where(eq(productIngredientRelationsTable.ingredientId, ingredientId))
        .orderBy(productIngredientRelationsTable.productId)
        .limit(pageSize)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(productIngredientRelationsTable)
        .where(eq(productIngredientRelationsTable.ingredientId, ingredientId));
      const total = Number(countResult[0]?.count ?? 0);

      return {
        code: 0,
        data: { items: rows, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.BIND_LIST_FAILED);
    }
  });

  /** 绑定商品 */
  app.post<{
    Params: { id: string };
    Body: { productId: number; quantity: number };
    Reply: ApiResponse<null>;
  }>('/ingredients/:id/products', {
    schema: {
      description: '绑定商品到原料',
      tags: ['Ingredients'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '原料ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          productId: { type: 'integer', description: '商品ID' },
          quantity: { type: 'number', description: '用量' },
        },
        required: ['productId'],
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
      const ingredientId = parsePositiveInt(request.params.id, '原料ID');
      const { productId, quantity } = request.body;

      const [product] = await db
        .select({ id: productsTable.id })
        .from(productsTable)
        .where(eq(productsTable.id, productId))
        .limit(1);

      if (!product) {
        throw new AppError(ingredientErrors.PRODUCT_NOT_FOUND);
      }

      const [existing] = await db
        .select()
        .from(productIngredientRelationsTable)
        .where(
          sql`${productIngredientRelationsTable.productId} = ${productId} and ${productIngredientRelationsTable.ingredientId} = ${ingredientId}`,
        )
        .limit(1);

      if (existing) {
        throw new AppError(ingredientErrors.PRODUCT_ALREADY_BOUND);
      }

      await db.insert(productIngredientRelationsTable).values({ productId, ingredientId, quantity: quantity ?? 0 });

      return {
        code: 0,
        data: null,
        message: '绑定成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.BIND_FAILED);
    }
  });

  /** 更新绑定用量 */
  app.patch<{
    Params: { id: string; productId: string };
    Body: { quantity: number };
    Reply: ApiResponse<null>;
  }>('/ingredients/:id/products/:productId/quantity', {
    schema: {
      description: '更新绑定用量',
      tags: ['Ingredients'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '原料ID' },
          productId: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id', 'productId'],
      },
      body: {
        type: 'object',
        properties: {
          quantity: { type: 'number', description: '用量' },
        },
        required: ['quantity'],
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
      const ingredientId = parsePositiveInt(request.params.id, '原料ID');
      const productId = parsePositiveInt(request.params.productId, '商品ID');
      const { quantity } = request.body;

      const [existing] = await db
        .select()
        .from(productIngredientRelationsTable)
        .where(
          sql`${productIngredientRelationsTable.productId} = ${productId} and ${productIngredientRelationsTable.ingredientId} = ${ingredientId}`,
        )
        .limit(1);

      if (!existing) {
        throw new AppError(ingredientErrors.BIND_NOT_FOUND);
      }

      await db
        .update(productIngredientRelationsTable)
        .set({ quantity })
        .where(
          sql`${productIngredientRelationsTable.productId} = ${productId} and ${productIngredientRelationsTable.ingredientId} = ${ingredientId}`,
        );

      return {
        code: 0,
        data: null,
        message: '更新用量成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.BIND_QUANTITY_UPDATE_FAILED);
    }
  });

  /** 解绑商品 */
  app.delete<{
    Params: { id: string; productId: string };
    Reply: ApiResponse<null>;
  }>('/ingredients/:id/products/:productId', {
    schema: {
      description: '解绑商品',
      tags: ['Ingredients'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '原料ID' },
          productId: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id', 'productId'],
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
      const ingredientId = parsePositiveInt(request.params.id, '原料ID');
      const productId = parsePositiveInt(request.params.productId, '商品ID');

      await db
        .delete(productIngredientRelationsTable)
        .where(
          sql`${productIngredientRelationsTable.productId} = ${productId} and ${productIngredientRelationsTable.ingredientId} = ${ingredientId}`,
        );

      return {
        code: 0,
        data: null,
        message: '解绑成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.UNBIND_FAILED);
    }
  });

  /** 原料选项（供 SelectPicker 使用） */
  app.get<{
    Reply: ApiResponse<Array<{ label: string; value: string; unit: string }>>;
  }>('/ingredients/options', {
    schema: {
      description: '原料选项列表',
      tags: ['Ingredients'],
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
                  label: { type: 'string' },
                  value: { type: 'string' },
                  unit: { type: 'string' },
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
      const rows = await db
        .select({
          label: ingredientsTable.name,
          value: sql<string>`cast(${ingredientsTable.id} as char)`,
          unit: ingredientsTable.unit,
        })
        .from(ingredientsTable)
        .orderBy(ingredientsTable.id);

      return {
        code: 0,
        data: rows,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.LIST_FAILED);
    }
  });

  // ──── 客制化选项绑定（选项表直接存储 ingredientId） ────

  /** 获取引用此原料的客制化选项列表 */
  app.get<{
    Querystring: { page?: string; pageSize?: string };
    Params: { id: string };
    Reply: ApiResponse<PaginatedData<{ optionId: number; optionName: string; customizationName: string; quantity: number }>>;
  }>('/ingredients/:id/customization-options', {
    schema: {
      description: '获取引用此原料的客制化选项列表',
      tags: ['Ingredients'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '原料ID' },
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
            code: { type: 'integer' },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      optionId: { type: 'integer' },
                      optionName: { type: 'string' },
                      customizationName: { type: 'string' },
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
      const ingredientId = parsePositiveInt(request.params.id, '原料ID');
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const rows = await db
        .select({
          optionId: customizationOptionsTable.id,
          optionName: customizationOptionsTable.name,
          customizationName: productCustomizationsTable.name,
          quantity: customizationOptionsTable.quantity,
        })
        .from(customizationOptionsTable)
        .innerJoin(productCustomizationsTable, eq(customizationOptionsTable.customizationId, productCustomizationsTable.id))
        .where(eq(customizationOptionsTable.ingredientId, ingredientId))
        .orderBy(customizationOptionsTable.id)
        .limit(pageSize)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(customizationOptionsTable)
        .where(eq(customizationOptionsTable.ingredientId, ingredientId));
      const total = Number(countResult[0]?.count ?? 0);

      return {
        code: 0,
        data: { items: rows, total, page, pageSize },
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.OPTION_BIND_LIST_FAILED);
    }
  });

  /** 将客制化选项绑定到原料（设置选项的 ingredientId） */
  app.post<{
    Params: { id: string };
    Body: { optionId: number; quantity: number };
    Reply: ApiResponse<null>;
  }>('/ingredients/:id/customization-options', {
    schema: {
      description: '将客制化选项绑定到原料',
      tags: ['Ingredients'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '原料ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          optionId: { type: 'integer', description: '客制化选项ID' },
          quantity: { type: 'number', description: '用量' },
        },
        required: ['optionId'],
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
      const ingredientId = parsePositiveInt(request.params.id, '原料ID');
      const { optionId, quantity } = request.body;

      const [option] = await db
        .select({ id: customizationOptionsTable.id })
        .from(customizationOptionsTable)
        .where(eq(customizationOptionsTable.id, optionId))
        .limit(1);

      if (!option) {
        throw new AppError(ingredientErrors.OPTION_NOT_FOUND);
      }

      await db
        .update(customizationOptionsTable)
        .set({ ingredientId, quantity: quantity ?? 0 })
        .where(eq(customizationOptionsTable.id, optionId));

      return {
        code: 0,
        data: null,
        message: '绑定成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.OPTION_BIND_FAILED);
    }
  });

  /** 更新用量 */
  app.patch<{
    Params: { id: string; optionId: string };
    Body: { quantity: number };
    Reply: ApiResponse<null>;
  }>('/ingredients/:id/customization-options/:optionId/quantity', {
    schema: {
      description: '更新绑定用量',
      tags: ['Ingredients'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '原料ID' },
          optionId: { type: 'string', minLength: 1, description: '客制化选项ID' },
        },
        required: ['id', 'optionId'],
      },
      body: {
        type: 'object',
        properties: {
          quantity: { type: 'number', description: '用量' },
        },
        required: ['quantity'],
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
      const ingredientId = parsePositiveInt(request.params.id, '原料ID');
      const optionId = parsePositiveInt(request.params.optionId, '客制化选项ID');

      const [option] = await db
        .select()
        .from(customizationOptionsTable)
        .where(eq(customizationOptionsTable.id, optionId))
        .limit(1);

      if (!option || option.ingredientId !== ingredientId) {
        throw new AppError(ingredientErrors.OPTION_BIND_NOT_FOUND);
      }

      await db
        .update(customizationOptionsTable)
        .set({ quantity: request.body.quantity })
        .where(eq(customizationOptionsTable.id, optionId));

      return {
        code: 0,
        data: null,
        message: '更新用量成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.OPTION_QUANTITY_UPDATE_FAILED);
    }
  });

  /** 解绑（清除选项的 ingredientId） */
  app.delete<{
    Params: { id: string; optionId: string };
    Reply: ApiResponse<null>;
  }>('/ingredients/:id/customization-options/:optionId', {
    schema: {
      description: '解绑客制化选项',
      tags: ['Ingredients'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '原料ID' },
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
      const ingredientId = parsePositiveInt(request.params.id, '原料ID');
      const optionId = parsePositiveInt(request.params.optionId, '客制化选项ID');

      const [option] = await db
        .select()
        .from(customizationOptionsTable)
        .where(eq(customizationOptionsTable.id, optionId))
        .limit(1);

      if (!option || option.ingredientId !== ingredientId) {
        throw new AppError(ingredientErrors.OPTION_BIND_NOT_FOUND);
      }

      await db
        .update(customizationOptionsTable)
        .set({ ingredientId: null, quantity: 0 })
        .where(eq(customizationOptionsTable.id, optionId));

      return {
        code: 0,
        data: null,
        message: '解绑成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(ingredientErrors.OPTION_UNBIND_FAILED);
    }
  });
}
