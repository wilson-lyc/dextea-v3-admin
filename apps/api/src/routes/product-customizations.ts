import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { AppError } from '../errorcode/index.js';
import { productCustomizationErrors } from '../errorcode/product-customizations.js';
import { parsePositiveInt } from '../utils/validation.js';
import {
  listCustomizations,
  getCustomization,
  createCustomization,
  updateCustomization,
  updateCustomizationStatus,
  getCustomizationOptions,
  createCustomizationOption,
  updateCustomizationOption,
  deleteCustomizationOption,
} from '../services/product-customization.service.js';
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
      const keyword = request.query.keyword;
      const status = request.query.status !== undefined && request.query.status !== ''
        ? parseInt(request.query.status, 10)
        : undefined;
      const productId = request.query.productId !== undefined && request.query.productId !== ''
        ? parseInt(request.query.productId, 10)
        : undefined;

      const result = await listCustomizations(db, { page, pageSize, keyword, status, productId });

      return {
        code: 0,
        data: result,
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

      const item = await getCustomization(db, id);

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
      const created = await createCustomization(db, request.body);

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

      const updated = await updateCustomization(db, id, request.body);

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

  /** 单独更新客制化项目状态 */
  app.patch<{
    Params: { id: string };
    Body: { status: number };
    Reply: ApiResponse<ProductCustomization>;
  }>('/product-customizations/:id/status', {
    schema: {
      description: '单独更新客制化项目状态',
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
          status: { type: 'integer', description: '0=下架 1=启用' },
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
                productId: { type: 'integer' },
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
      const { status } = request.body;

      const updated = await updateCustomizationStatus(db, id, status);

      return {
        code: 0,
        data: updated,
        message: '状态更新成功',
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

      const options = await getCustomizationOptions(db, customizationId);

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

      const created = await createCustomizationOption(db, customizationId, request.body);

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

      const updated = await updateCustomizationOption(db, customizationId, optionId, request.body);

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

      await deleteCustomizationOption(db, customizationId, optionId);

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
