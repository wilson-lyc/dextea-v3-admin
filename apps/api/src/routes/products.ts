import type { FastifyInstance } from 'fastify';
import { getDb } from '../plugins/db/mysql/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { ProductErrorCodes } from '@/module/products/product.errorcode.js';
import { parsePositiveInt } from '../utils/validation.js';
import {
  listProducts,
  getProductBasicInfo,
  createProduct,
  updateProduct,
  updateProductStatus,
  getProductTags,
  bindTagToProduct,
  unbindTagFromProduct,
  getProductIngredients,
  bindIngredientToProduct,
  updateIngredientQuantity,
  unbindIngredientFromProduct,
  getProductOptions,
} from '../services/product.service.js';
import type {
  ApiResponse,
  PaginatedData,
  Product,
  ProductTag,
  ProductQuery,
  CreateProductInput,
  CreateProductResponse,
  BindTagToProductInput,
  UnbindTagFromProductInput,
} from '@dextea/shared-types';


export async function productRoutes(app: FastifyInstance) {
  /** 商品列表 */
  app.get<{
    Querystring: ProductQuery;
    Reply: ApiResponse<PaginatedData<Product>>;
  }>('/products', {
    schema: {
      description: '商品列表',
      tags: ['Products'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码' },
          pageSize: { type: 'string', description: '每页数量' },
          keyword: { type: 'string', description: '搜索关键词' },
          status: { type: 'string', description: '商品状态' },
          priceMin: { type: 'string', description: '最低价格' },
          priceMax: { type: 'string', description: '最高价格' },
          tagIds: { type: 'string', description: '标签ID列表，逗号分隔' },
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
                      brief: { type: 'string' },
                      description: { type: 'string' },
                      status: { type: 'integer', description: '0=下架 1=可售' },
                      price: { type: 'number' },
                      tags: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            name: { type: 'string' },
                          },
                        },
                      },
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

      const status = request.query.status ? parseInt(request.query.status, 10) : undefined;
      const priceMin = request.query.priceMin ? parseFloat(request.query.priceMin) : undefined;
      const priceMax = request.query.priceMax ? parseFloat(request.query.priceMax) : undefined;

      const tagIds = request.query.tagIds
        ? request.query.tagIds.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0)
        : undefined;

      const data = await listProducts(db, { page, pageSize, keyword, status, priceMin, priceMax, tagIds });

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(ProductErrorCodes.LIST_FAILED);
    }
  });

  /** 新增商品 */
  app.post<{
    Body: CreateProductInput;
    Reply: ApiResponse<CreateProductResponse>;
  }>('/products', {
    schema: {
      description: '新增商品',
      tags: ['Products'],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: '商品名称' },
          brief: { type: 'string', description: '简介' },
          description: { type: 'string', description: '描述' },
          price: { type: 'number', description: '价格' },
          tagIds: { type: 'array', items: { type: 'integer' }, description: '标签ID列表' },
          status: { type: 'integer', description: '0=下架 1=可售' },
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
                id: { type: 'integer', description: '商品ID' },
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
      const { name, brief, description, price, status, tagIds } = request.body;

      const result = await createProduct(db, { name, brief, description, price, status, tagIds });

      return {
        code: 0,
        data: { id: result.id },
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(ProductErrorCodes.STATUS_UPDATE_FAILED);
    }
  });

  /** 商品基础信息 */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<Product>;
  }>('/products/:id/basic-info', {
    schema: {
      description: '商品基础信息',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
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
                brief: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'integer', description: '0=下架 1=可售' },
                price: { type: 'number' },
                tags: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                    },
                  },
                },
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
      const id = parsePositiveInt(request.params.id, '商品ID');

      const product = await getProductBasicInfo(db, id);

      return {
        code: 0,
        data: product,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(ProductErrorCodes.LIST_FAILED);
    }
  });

  /** 商品标签列表 */
  app.get<{
    Params: { id: string };
    Querystring: { page?: string; pageSize?: string };
    Reply: ApiResponse<PaginatedData<ProductTag>>;
  }>('/products/:id/tags', {
    schema: {
      description: '商品标签列表',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
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
      const id = parsePositiveInt(request.params.id, '商品ID');
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));

      const data = await getProductTags(db, id, page, pageSize);

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(ProductErrorCodes.LIST_FAILED);
    }
  });

  /** 更新商品 */
  app.put<{
    Params: { id: string };
    Body: Partial<CreateProductInput>;
    Reply: ApiResponse<Product>;
  }>('/products/:id', {
    schema: {
      description: '更新商品',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '商品名称' },
          brief: { type: 'string', description: '简介' },
          description: { type: 'string', description: '描述' },
          price: { type: 'number', description: '价格' },
          status: { type: 'integer', description: '0=下架 1=可售' },
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
                id: { type: 'integer' },
                name: { type: 'string' },
                brief: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'integer', description: '0=下架 1=可售' },
                price: { type: 'number' },
                tags: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                    },
                  },
                },
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
      const id = parsePositiveInt(request.params.id, '商品ID');
      const { name, brief, description, price, status } = request.body;

      const updated = await updateProduct(db, id, { name, brief, description, price, status });

      return {
        code: 0,
        data: updated,
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(ProductErrorCodes.UPDATE_FAILED);
    }
  });

  /** 上下架商品 */
  app.put<{
    Params: { id: string };
    Body: { status: number };
    Reply: ApiResponse<Product>;
  }>('/products/:id/status', {
    schema: {
      description: '上下架商品',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id'],
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
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                brief: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'integer' },
                price: { type: 'number' },
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
      const id = parsePositiveInt(request.params.id, '商品ID');
      const { status } = request.body;

      const updated = await updateProductStatus(db, id, status);

      const statusLabel = updated.status === 1 ? '可售' : '下架';

      return {
        code: 0,
        data: updated,
        message: `「${updated.name}」的全局状态已更新为「${statusLabel}」`,
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(ProductErrorCodes.UPDATE_FAILED);
    }
  });

  /** 批量绑定商品标签 */
  app.post<{
    Params: { id: string };
    Body: BindTagToProductInput;
    Reply: ApiResponse<null>;
  }>('/products/:id/tags', {
    schema: {
      description: '批量绑定标签到商品',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          tagIds: {
            type: 'array',
            items: { type: 'integer' },
            minItems: 1,
            description: '标签ID列表',
          },
        },
        required: ['tagIds'],
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
      const productId = parsePositiveInt(request.params.id, '商品ID');
      const { tagIds } = request.body;

      const result = await bindTagToProduct(db, productId, tagIds);

      return {
        code: 0,
        data: null,
        message: `成功绑定 ${result.boundCount} 个标签`,
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(ProductErrorCodes.TAG_ADD_FAILED);
    }
  });

  /** 批量解绑商品标签 */
  app.delete<{
    Params: { id: string };
    Body: UnbindTagFromProductInput;
    Reply: ApiResponse<null>;
  }>('/products/:id/tags', {
    schema: {
      description: '批量解绑标签与商品的关联',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          tagIds: {
            type: 'array',
            items: { type: 'integer' },
            minItems: 1,
            description: '标签ID列表',
          },
        },
        required: ['tagIds'],
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
      const productId = parsePositiveInt(request.params.id, '商品ID');
      const { tagIds } = request.body;

      await unbindTagFromProduct(db, productId, tagIds);

      return {
        code: 0,
        data: null,
        message: '解绑成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(ProductErrorCodes.TAG_REMOVE_FAILED);
    }
  });



  /** 获取绑定原料列表 */
  app.get<{
    Querystring: { page?: string; pageSize?: string };
    Params: { id: string };
    Reply: ApiResponse<PaginatedData<{ ingredientId: number; ingredientName: string; unit: string; quantity: number }>>;
  }>('/products/:id/ingredients', {
    schema: {
      description: '获取绑定原料列表',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
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
                      ingredientId: { type: 'integer' },
                      ingredientName: { type: 'string' },
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
      const productId = parsePositiveInt(request.params.id, '商品ID');
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));

      const data = await getProductIngredients(db, productId, page, pageSize);

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(ProductErrorCodes.INGREDIENT_BIND_LIST_FAILED);
    }
  });

  /** 绑定原料 */
  app.post<{
    Params: { id: string };
    Body: { ingredientId: number; quantity: number };
    Reply: ApiResponse<null>;
  }>('/products/:id/ingredients', {
    schema: {
      description: '绑定原料到商品',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          ingredientId: { type: 'integer', description: '原料ID' },
          quantity: { type: 'number', description: '用量' },
        },
        required: ['ingredientId'],
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
      const productId = parsePositiveInt(request.params.id, '商品ID');
      const { ingredientId, quantity } = request.body;

      await bindIngredientToProduct(db, productId, ingredientId, quantity);

      return {
        code: 0,
        data: null,
        message: '绑定成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(ProductErrorCodes.INGREDIENT_BIND_FAILED);
    }
  });

  /** 更新绑定用量 */
  app.patch<{
    Params: { id: string; ingredientId: string };
    Body: { quantity: number };
    Reply: ApiResponse<null>;
  }>('/products/:id/ingredients/:ingredientId/quantity', {
    schema: {
      description: '更新绑定用量',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
          ingredientId: { type: 'string', minLength: 1, description: '原料ID' },
        },
        required: ['id', 'ingredientId'],
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
      const productId = parsePositiveInt(request.params.id, '商品ID');
      const ingredientId = parsePositiveInt(request.params.ingredientId, '原料ID');
      const { quantity } = request.body;

      await updateIngredientQuantity(db, productId, ingredientId, quantity);

      return {
        code: 0,
        data: null,
        message: '更新用量成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(ProductErrorCodes.INGREDIENT_QUANTITY_UPDATE_FAILED);
    }
  });

  /** 解绑原料 */
  app.delete<{
    Params: { id: string; ingredientId: string };
    Reply: ApiResponse<null>;
  }>('/products/:id/ingredients/:ingredientId', {
    schema: {
      description: '解绑原料',
      tags: ['Products'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '商品ID' },
          ingredientId: { type: 'string', minLength: 1, description: '原料ID' },
        },
        required: ['id', 'ingredientId'],
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
      const productId = parsePositiveInt(request.params.id, '商品ID');
      const ingredientId = parsePositiveInt(request.params.ingredientId, '原料ID');

      await unbindIngredientFromProduct(db, productId, ingredientId);

      return {
        code: 0,
        data: null,
        message: '解绑成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(ProductErrorCodes.INGREDIENT_UNBIND_FAILED);
    }
  });

  /** 商品选项（供 SelectPicker 使用） */
  app.get<{
    Reply: ApiResponse<Array<{ label: string; value: string }>>;
  }>('/products/options', {
    schema: {
      description: '商品选项列表',
      tags: ['Products'],
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
      const rows = await getProductOptions(db);

      return {
        code: 0,
        data: rows,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(ProductErrorCodes.LIST_FAILED);
    }
  });
}
