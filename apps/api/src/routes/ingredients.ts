import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { ingredientsTable } from '../db/schema.js';
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
        .select()
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
}
