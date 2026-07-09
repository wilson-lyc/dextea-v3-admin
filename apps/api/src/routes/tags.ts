import type { FastifyInstance } from 'fastify';
import { getDb } from '../plugins/db/mysql/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { TagErrorCodes } from '../errorcode/tags.js';
import { parsePositiveInt } from '../utils/validation.js';
import {
  listTagOptions,
  listTags,
  createTag,
  updateTag,
  getTagProducts,
  bindProductToTag,
  unbindProductFromTag,
  deleteTag,
} from '../services/tag.service.js';
import type {
  ApiResponse,
  PaginatedData,
  ProductTag,
  CreateTagInput,
  UpdateTagInput,
  TagQuery,
  BindProductToTagInput,
  UnbindProductFromTagInput,
} from '@dextea/shared-types';

export async function tagRoutes(app: FastifyInstance) {
  /** 商品标签选项（供 SelectPicker 使用） */
  app.get<{
    Reply: ApiResponse<Array<{ label: string; value: string }>>;
  }>('/tags/options', {
    schema: {
      description: '商品标签选项列表',
      tags: ['Tags'],
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
      const data = await listTagOptions(db);

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(TagErrorCodes.LIST_FAILED);
    }
  });

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

      const data = await listTags(db, { page, pageSize });

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(TagErrorCodes.LIST_FAILED);
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

      const data = await createTag(db, name);

      return {
        code: 0,
        data,
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(TagErrorCodes.CREATE_FAILED);
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

      const data = await updateTag(db, id, name);

      return {
        code: 0,
        data,
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(TagErrorCodes.UPDATE_FAILED);
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

      const data = await getTagProducts(db, id, page, pageSize);

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(TagErrorCodes.LIST_FAILED);
    }
  });

  /** 批量绑定商品到标签 */
  app.post<{
    Params: { id: string };
    Body: BindProductToTagInput;
    Reply: ApiResponse<null>;
  }>('/tags/:id/products', {
    schema: {
      description: '批量绑定商品到标签',
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
          productIds: {
            type: 'array',
            items: { type: 'integer' },
            minItems: 1,
            description: '商品ID列表',
          },
        },
        required: ['productIds'],
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
      const { productIds } = request.body;

      const result = await bindProductToTag(db, id, productIds);

      if (result.boundCount === 0) {
        throw new BizError(TagErrorCodes.PRODUCT_ALREADY_BOUND);
      }

      return {
        code: 0,
        data: null,
        message: `成功绑定 ${result.boundCount} 个商品`,
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(TagErrorCodes.BIND_FAILED);
    }
  });

  /** 批量解绑商品标签 */
  app.delete<{
    Params: { id: string };
    Body: UnbindProductFromTagInput;
    Reply: ApiResponse<null>;
  }>('/tags/:id/products', {
    schema: {
      description: '批量解绑商品与标签的关联',
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
          productIds: {
            type: 'array',
            items: { type: 'integer' },
            minItems: 1,
            description: '商品ID列表',
          },
        },
        required: ['productIds'],
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
      const { productIds } = request.body;

      await unbindProductFromTag(db, id, productIds);

      return {
        code: 0,
        data: null,
        message: '解绑成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(TagErrorCodes.UNBIND_FAILED);
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

      await deleteTag(db, id);

      return {
        code: 0,
        data: null,
        message: '删除成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(TagErrorCodes.DELETE_FAILED);
    }
  });
}
