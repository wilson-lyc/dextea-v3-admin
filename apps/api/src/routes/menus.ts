import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/index.js';
import { AppError } from '../errorcode/index.js';
import { menuErrors } from '../errorcode/menus.js';
import { parsePositiveInt } from '../utils/validation.js';
import {
  listMenus,
  createMenu,
  getMenu,
  updateMenu,
  deleteMenu,
  listMenuGroups,
  createMenuGroup,
  updateMenuGroup,
  deleteMenuGroup,
  listMenuProducts,
  addMenuProducts,
  removeMenuProduct,
} from '../services/menu.service.js';
import type {
  ApiResponse,
  PaginatedData,
  Menu,
  MenuGroup,
  MenuProduct,
  CreateMenuInput,
  UpdateMenuInput,
  CreateMenuResponse,
  UpdateMenuResponse,
  CreateMenuGroupResponse,
  MenuQuery,
} from '@dextea/shared-types';

export async function menuRoutes(app: FastifyInstance) {
  /** 菜单列表 */
  app.get<{
    Querystring: MenuQuery;
    Reply: ApiResponse<PaginatedData<Menu>>;
  }>('/menus', {
    schema: {
      description: '获取菜单列表',
      tags: ['Menus'],
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
                      description: { type: 'string' },
                      groupCount: { type: 'integer', description: '分组数量' },
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

      const data = await listMenus(db, { page, pageSize, keyword: request.query.keyword });

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(menuErrors.LIST_FAILED);
    }
  });

  /** 新增菜单 */
  app.post<{
    Body: CreateMenuInput;
    Reply: ApiResponse<CreateMenuResponse>;
  }>('/menus', {
    schema: {
      description: '新增菜单',
      tags: ['Menus'],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: '菜单名称' },
          description: { type: 'string', description: '菜单描述' },
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
                id: { type: 'integer', description: '菜单ID' },
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
      const { name, description } = request.body;

      const data = await createMenu(db, { name, description });

      return {
        code: 0,
        data,
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(menuErrors.CREATE_FAILED);
    }
  });

  /** 获取菜单详情 */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<Menu>;
  }>('/menus/:id', {
    schema: {
      description: '获取菜单详情',
      tags: ['Menus'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '菜单ID' },
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
                description: { type: 'string' },
                groupCount: { type: 'integer', description: '分组数量' },
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
      const id = parsePositiveInt(request.params.id, '菜单ID');

      const data = await getMenu(db, id);

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(menuErrors.LIST_FAILED);
    }
  });

  /** 更新菜单 */
  app.put<{
    Params: { id: string };
    Body: UpdateMenuInput;
    Reply: ApiResponse<UpdateMenuResponse>;
  }>('/menus/:id', {
    schema: {
      description: '更新菜单',
      tags: ['Menus'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '菜单ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: '菜单名称' },
          description: { type: 'string', description: '菜单描述' },
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
                id: { type: 'integer', description: '菜单ID' },
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
      const id = parsePositiveInt(request.params.id, '菜单ID');
      const { name, description } = request.body;

      const data = await updateMenu(db, id, { name, description });

      return {
        code: 0,
        data,
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(menuErrors.UPDATE_FAILED);
    }
  });

  /** 删除菜单 */
  app.delete<{
    Params: { id: string };
    Reply: ApiResponse<null>;
  }>('/menus/:id', {
    schema: {
      description: '删除菜单',
      tags: ['Menus'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '菜单ID' },
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
      const id = parsePositiveInt(request.params.id, '菜单ID');

      await deleteMenu(db, id);

      return {
        code: 0,
        data: null,
        message: '删除成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(menuErrors.DELETE_FAILED);
    }
  });

  /** 获取菜单分组列表 */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<MenuGroup[]>;
  }>('/menus/:id/groups', {
    schema: {
      description: '获取菜单分组列表',
      tags: ['Menus'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '菜单ID' },
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
                  id: { type: 'integer' },
                  menuId: { type: 'integer' },
                  name: { type: 'string' },
                  sortOrder: { type: 'integer' },
                  productCount: { type: 'integer', description: '商品数量' },
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
      const menuId = parsePositiveInt(request.params.id, '菜单ID');

      const data = await listMenuGroups(db, menuId);

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(menuErrors.LIST_GROUPS_FAILED);
    }
  });

  /** 新增菜单分组 */
  app.post<{
    Params: { id: string };
    Body: { name: string; sortOrder?: number };
    Reply: ApiResponse<CreateMenuGroupResponse>;
  }>('/menus/:id/groups', {
    schema: {
      description: '新增菜单分组',
      tags: ['Menus'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '菜单ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: '分组名称' },
          sortOrder: { type: 'integer', description: '排序值' },
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
                id: { type: 'integer', description: '分组ID' },
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
      const menuId = parsePositiveInt(request.params.id, '菜单ID');
      const { name, sortOrder } = request.body;

      const data = await createMenuGroup(db, { menuId, name, sortOrder });

      return {
        code: 0,
        data,
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(menuErrors.GROUP_CREATE_FAILED);
    }
  });

  /** 更新菜单分组 */
  app.put<{
    Params: { id: string };
    Body: { name?: string; sortOrder?: number };
    Reply: ApiResponse<{ id: number }>;
  }>('/menus/groups/:id', {
    schema: {
      description: '更新菜单分组',
      tags: ['Menus'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '分组ID' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, description: '分组名称' },
          sortOrder: { type: 'integer', description: '排序值' },
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
                id: { type: 'integer', description: '分组ID' },
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
      const id = parsePositiveInt(request.params.id, '分组ID');
      const { name, sortOrder } = request.body;

      const data = await updateMenuGroup(db, id, { name, sortOrder });

      return {
        code: 0,
        data,
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(menuErrors.GROUP_UPDATE_FAILED);
    }
  });

  /** 删除菜单分组 */
  app.delete<{
    Params: { id: string };
    Reply: ApiResponse<null>;
  }>('/menus/groups/:id', {
    schema: {
      description: '删除菜单分组',
      tags: ['Menus'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '分组ID' },
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
      const id = parsePositiveInt(request.params.id, '分组ID');

      await deleteMenuGroup(db, id);

      return {
        code: 0,
        data: null,
        message: '删除成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(menuErrors.GROUP_DELETE_FAILED);
    }
  });

  /** 获取分组商品列表 */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<MenuProduct[]>;
  }>('/menus/groups/:id/products', {
    schema: {
      description: '获取分组商品列表',
      tags: ['Menus'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '分组ID' },
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
                  groupId: { type: 'integer' },
                  productId: { type: 'integer' },
                  productName: { type: 'string' },
                  sortOrder: { type: 'integer' },
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
      const groupId = parsePositiveInt(request.params.id, '分组ID');

      const data = await listMenuProducts(db, groupId);

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(menuErrors.LIST_PRODUCTS_FAILED);
    }
  });

  /** 批量添加商品到分组 */
  app.post<{
    Params: { id: string };
    Body: { productIds: number[] };
    Reply: ApiResponse<null>;
  }>('/menus/groups/:id/products', {
    schema: {
      description: '批量添加商品到分组',
      tags: ['Menus'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '分组ID' },
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
      const groupId = parsePositiveInt(request.params.id, '分组ID');
      const { productIds } = request.body;

      const result = await addMenuProducts(db, groupId, productIds);

      if (result.boundCount === 0) {
        throw new AppError(menuErrors.PRODUCT_ALREADY_BOUND);
      }

      return {
        code: 0,
        data: null,
        message: `成功绑定 ${result.boundCount} 个商品`,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(menuErrors.PRODUCT_BIND_FAILED);
    }
  });

  /** 从分组移除商品 */
  app.delete<{
    Params: { id: string; productId: string };
    Reply: ApiResponse<null>;
  }>('/menus/groups/:id/products/:productId', {
    schema: {
      description: '从分组移除商品',
      tags: ['Menus'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '分组ID' },
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
      const groupId = parsePositiveInt(request.params.id, '分组ID');
      const productId = parsePositiveInt(request.params.productId, '商品ID');

      await removeMenuProduct(db, groupId, productId);

      return {
        code: 0,
        data: null,
        message: '移除成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(menuErrors.PRODUCT_UNBIND_FAILED);
    }
  });
}
