import type { FastifyInstance } from 'fastify';
import { getDb } from '../plugins/db/mysql/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { MenuErrorCodes } from '@/module/menus/menu.errorcode.js';
import { parsePositiveInt } from '../utils/validation.js';
import {
  listMenus,
  createMenu,
  getMenu,
  updateMenu,
  batchDeleteMenus,
  listMenuGroups,
  createMenuGroup,
  updateMenuGroup,
  batchDeleteMenuGroups,
  listMenuProducts,
  addMenuProduct,
  batchRemoveMenuProducts,
  updateMenuProductSort,
} from '../services/menu.service.js';
import {
  dispatchMenuByArea,
  dispatchMenuById,
  getMenuStores,
} from '../services/store.service.js';
import type {
  ApiResponse,
  PaginatedData,
  Menu,
  MenuGroup,
  MenuProduct,
  Store,
  CreateMenuInput,
  UpdateMenuInput,
  CreateMenuResponse,
  UpdateMenuResponse,
  CreateMenuGroupResponse,
  MenuQuery,
  AddMenuProductInput,
  UpdateMenuProductSortInput,
  BatchUnbindMenuProductsInput,
  BatchDeleteMenuGroupsInput,
  BatchDeleteMenusInput,
  DispatchMenuByAreaRequest,
  DispatchMenuByAreaResponse,
  DispatchMenuByIdRequest,
  DispatchMenuByIdResponse,
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

      const data = await listMenus(db, { page, pageSize });

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.LIST_FAILED);
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
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.CREATE_FAILED);
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
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.LIST_FAILED);
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
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.UPDATE_FAILED);
    }
  });

  /** 批量删除菜单 */
  app.delete<{
    Body: BatchDeleteMenusInput;
    Reply: ApiResponse<null>;
  }>('/menus', {
    schema: {
      description: '批量删除菜单',
      tags: ['Menus'],
      body: {
        type: 'object',
        properties: {
          menuIds: {
            type: 'array',
            minItems: 1,
            items: { type: 'integer' },
            description: '菜单ID列表',
          },
        },
        required: ['menuIds'],
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
      const { menuIds } = request.body as BatchDeleteMenusInput;

      await batchDeleteMenus(db, menuIds);

      return {
        code: 0,
        data: null,
        message: `成功删除 ${menuIds.length} 个菜单`,
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.DELETE_FAILED);
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
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.LIST_GROUPS_FAILED);
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
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.GROUP_CREATE_FAILED);
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
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.GROUP_UPDATE_FAILED);
    }
  });

  /** 批量删除菜单分组 */
  app.delete<{
    Body: BatchDeleteMenuGroupsInput;
    Reply: ApiResponse<null>;
  }>('/menus/groups', {
    schema: {
      description: '批量删除菜单分组',
      tags: ['Menus'],
      body: {
        type: 'object',
        properties: {
          groupIds: {
            type: 'array',
            minItems: 1,
            items: { type: 'integer' },
            description: '分组ID列表',
          },
        },
        required: ['groupIds'],
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
      const { groupIds } = request.body;

      await batchDeleteMenuGroups(db, groupIds);

      return {
        code: 0,
        data: null,
        message: `成功删除 ${groupIds.length} 个分组`,
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.GROUP_BATCH_DELETE_FAILED);
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
                  price: { type: 'number', description: '商品价格' },
                  status: { type: 'integer', description: '全局状态，0=下架 1=可售' },
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
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.LIST_PRODUCTS_FAILED);
    }
  });

  /** 添加商品到分组 */
  app.post<{
    Params: { id: string };
    Body: AddMenuProductInput;
    Reply: ApiResponse<null>;
  }>('/menus/groups/:id/products', {
    schema: {
      description: '添加商品到分组',
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
          productId: { type: 'integer', description: '商品ID' },
          sortOrder: { type: 'integer', description: '排序值，默认 0' },
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
      const groupId = parsePositiveInt(request.params.id, '分组ID');
      const { productId, sortOrder = 0 } = request.body;

      const result = await addMenuProduct(db, groupId, productId, sortOrder);

      if (!result.bound) {
        throw new BizError(MenuErrorCodes.PRODUCT_ALREADY_BOUND);
      }

      return {
        code: 0,
        data: null,
        message: '绑定成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.PRODUCT_BIND_FAILED);
    }
  });

  /** 批量从分组移除商品 */
  app.delete<{
    Params: { id: string };
    Body: BatchUnbindMenuProductsInput;
    Reply: ApiResponse<null>;
  }>('/menus/groups/:id/products', {
    schema: {
      description: '批量从分组移除商品',
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
            minItems: 1,
            items: { type: 'integer' },
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

      await batchRemoveMenuProducts(db, groupId, productIds);

      return {
        code: 0,
        data: null,
        message: `成功解绑 ${productIds.length} 个商品`,
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.PRODUCT_BATCH_UNBIND_FAILED);
    }
  });

  /** 更新分组商品排序 */
  app.put<{
    Params: { id: string };
    Body: UpdateMenuProductSortInput;
    Reply: ApiResponse<null>;
  }>('/menus/groups/:id/products/sort', {
    schema: {
      description: '更新分组商品排序',
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
          productId: { type: 'integer', description: '商品ID' },
          sortOrder: { type: 'integer', description: '排序值' },
        },
        required: ['productId', 'sortOrder'],
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
      const { productId, sortOrder } = request.body;

      await updateMenuProductSort(db, groupId, productId, sortOrder);

      return {
        code: 0,
        data: null,
        message: '排序更新成功',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.PRODUCT_SORT_UPDATE_FAILED);
    }
  });

  /** 获取菜单关联的门店列表 */
  app.get<{
    Params: { id: string };
    Querystring: MenuQuery;
    Reply: ApiResponse<PaginatedData<Store>>;
  }>('/menus/:id/stores', {
    schema: {
      description: '获取菜单关联的门店列表',
      tags: ['Menus'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1, description: '菜单ID' },
        },
        required: ['id'],
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码' },
          pageSize: { type: 'string', description: '每页条数' },
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
                      province: { type: 'string' },
                      city: { type: 'string' },
                      district: { type: 'string' },
                      address: { type: 'string' },
                      status: { type: 'integer', description: '0=休息中 1=营业中 2=筹备中 3=已注销' },
                      businessHours: { type: 'string' },
                      phone: { type: 'string' },
                      longitude: { type: 'number' },
                      latitude: { type: 'number' },
                      account: { type: 'string' },
                      email: { type: 'string' },
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
      const menuId = parsePositiveInt(request.params.id, '菜单ID');
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));

      const data = await getMenuStores(db, menuId, { page, pageSize });

      return {
        code: 0,
        data,
        message: 'ok',
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.LIST_FAILED);
    }
  });

  /** 按地域分发菜单 */
  app.post<{
    Params: { id: string };
    Body: DispatchMenuByAreaRequest;
    Reply: ApiResponse<DispatchMenuByAreaResponse>;
  }>('/menus/:id/dispatch/area', {
    schema: {
      description: '按地域分发菜单到匹配的门店',
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
          province: { type: 'string', minLength: 1, description: '省份（必填）' },
          city: { type: 'string', description: '城市（选填）' },
          district: { type: 'string', description: '区县（选填）' },
        },
        required: ['province'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                matched: { type: 'integer', description: '符合区域条件的门店总数' },
                dispatched: { type: 'integer', description: '成功分发的门店数' },
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
      const { province, city, district } = request.body;

      const result = await dispatchMenuByArea(db, menuId, { province, city, district });

      return {
        code: 0,
        data: result,
        message: `区域内共 ${result.matched} 家门店，成功分发 ${result.dispatched} 家`,
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.DISPATCH_AREA_FAILED);
    }
  });

  /** 按ID分发菜单 */
  app.post<{
    Params: { id: string };
    Body: DispatchMenuByIdRequest;
    Reply: ApiResponse<DispatchMenuByIdResponse>;
  }>('/menus/:id/dispatch/id', {
    schema: {
      description: '按ID分发菜单到指定门店',
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
          storeIds: {
            type: 'array',
            minItems: 1,
            items: { type: 'integer' },
            description: '门店ID列表',
          },
        },
        required: ['storeIds'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            code: { type: 'integer', description: '业务状态码，0=成功' },
            data: {
              type: 'object',
              properties: {
                matched: { type: 'integer', description: '匹配的门店数量' },
                dispatched: { type: 'integer', description: '成功分发的门店数' },
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
      const { storeIds } = request.body;

      const result = await dispatchMenuById(db, menuId, { storeIds });

      return {
        code: 0,
        data: result,
        message: `共匹配 ${result.matched} 家门店，成功分发 ${result.dispatched} 家`,
      };
    } catch (error) {
      if (error instanceof BizError) throw error;
      request.log.error(error);
      throw new BizError(MenuErrorCodes.DISPATCH_ID_FAILED);
    }
  });
}
