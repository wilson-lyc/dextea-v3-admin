import type { FastifyInstance } from 'fastify';
import { getDb } from '../plugins/db/mysql/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { IngredientErrorCodes } from '../errorcode/ingredients.js';
import { parsePositiveInt } from '../utils/validation.js';
import {
  listIngredients,
  createIngredient,
  getIngredient,
  updateIngredient,
  updateIngredientStatus,
  getIngredientProducts,
  bindProductToIngredient,
  updateBindQuantity,
  unbindProductFromIngredient,
  getIngredientOptionsList,
  getIngredientOptions,
  bindOptionToIngredient,
  updateOptionQuantity,
  unbindOptionFromIngredient,
} from '../services/ingredient.service.js';
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
      const keyword = request.query.keyword;

      const data = await listIngredients(db, { page, pageSize, keyword });

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.LIST_FAILED);
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
      const input = request.body;

      const data = await createIngredient(db, input);

      return {
        code: 0,
        data,
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.CREATE_FAILED);
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

      const data = await getIngredient(db, id);

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.LIST_FAILED);
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
      const input = request.body;

      const data = await updateIngredient(db, id, input);

      return {
        code: 0,
        data,
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.UPDATE_FAILED);
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

      const data = await updateIngredientStatus(db, id, status);

      return {
        code: 0,
        data,
        message: '更新状态成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.STATUS_UPDATE_FAILED);
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

      const data = await getIngredientProducts(db, ingredientId, page, pageSize);

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.BIND_LIST_FAILED);
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

      await bindProductToIngredient(db, ingredientId, productId, quantity);

      return {
        code: 0,
        data: null,
        message: '绑定成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.BIND_FAILED);
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

      await updateBindQuantity(db, ingredientId, productId, quantity);

      return {
        code: 0,
        data: null,
        message: '更新用量成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.BIND_QUANTITY_UPDATE_FAILED);
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

      await unbindProductFromIngredient(db, ingredientId, productId);

      return {
        code: 0,
        data: null,
        message: '解绑成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.UNBIND_FAILED);
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
      const data = await getIngredientOptionsList(db);

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.LIST_FAILED);
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

      const data = await getIngredientOptions(db, ingredientId, page, pageSize);

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.OPTION_BIND_LIST_FAILED);
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

      await bindOptionToIngredient(db, ingredientId, optionId, quantity);

      return {
        code: 0,
        data: null,
        message: '绑定成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.OPTION_BIND_FAILED);
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
      const { quantity } = request.body;

      await updateOptionQuantity(db, ingredientId, optionId, quantity);

      return {
        code: 0,
        data: null,
        message: '更新用量成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.OPTION_QUANTITY_UPDATE_FAILED);
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

      await unbindOptionFromIngredient(db, ingredientId, optionId);

      return {
        code: 0,
        data: null,
        message: '解绑成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(IngredientErrorCodes.OPTION_UNBIND_FAILED);
    }
  });
}
