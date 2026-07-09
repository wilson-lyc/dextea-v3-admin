import { z } from 'zod/v4';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { ApiResponse, ApiResponseSchema } from '@/common/types/index.js';
import { menuService } from './menu.service.js';
import {
  MenuListRequestSchema,
  MenuListResponseSchema,
  MenuGetResponseSchema,
  CreateMenuRequestSchema,
  CreateMenuResponseSchema,
  UpdateMenuRequestSchema,
  UpdateMenuResponseSchema,
  BatchDeleteMenusRequestSchema,
  MenuGroupListResponseSchema,
  CreateMenuGroupRequestSchema,
  CreateMenuGroupResponseSchema,
  UpdateMenuGroupRequestSchema,
  UpdateMenuGroupResponseSchema,
  BatchDeleteMenuGroupsRequestSchema,
  MenuProductListResponseSchema,
  AddMenuProductRequestSchema,
  BatchRemoveMenuProductsRequestSchema,
  UpdateMenuProductSortRequestSchema,
  MenuStoreListRequestSchema,
  MenuStoreListResponseSchema,
  DispatchByAreaRequestSchema,
  DispatchByAreaResponseSchema,
  DispatchByIdRequestSchema,
  DispatchByIdResponseSchema,
} from './menu.type.js';

export const registerMenuRoutes: FastifyPluginAsyncZod = async (app) => {
  // ─── 菜单 ──────────────────────────────────────────

  // 菜单列表
  app.get(
    '/menus',
    {
      schema: {
        tags: ['Menus'],
        description: '菜单列表',
        querystring: MenuListRequestSchema,
        response: { 200: ApiResponseSchema(MenuListResponseSchema).describe('菜单列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, _reply) => {
      const data = await menuService.getMenuList(_request.query);
      return ApiResponse.success(data);
    },
  );

  // 新增菜单
  app.post(
    '/menus',
    {
      schema: {
        tags: ['Menus'],
        description: '新增菜单',
        body: CreateMenuRequestSchema,
        response: { 200: ApiResponseSchema(CreateMenuResponseSchema).describe('创建成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await menuService.createMenu(request.body);
      return ApiResponse.success(data);
    },
  );

  // 菜单详情
  app.get(
    '/menus/:id',
    {
      schema: {
        tags: ['Menus'],
        description: '菜单详情',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: { 200: ApiResponseSchema(MenuGetResponseSchema).describe('菜单详情') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await menuService.getMenuById(request.params.id);
      return ApiResponse.success(data);
    },
  );

  // 更新菜单
  app.put(
    '/menus/:id',
    {
      schema: {
        tags: ['Menus'],
        description: '更新菜单',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateMenuRequestSchema,
        response: { 200: ApiResponseSchema(UpdateMenuResponseSchema).describe('更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await menuService.updateMenu(request.params.id, request.body);
      return ApiResponse.success(data);
    },
  );

  // 批量删除菜单
  app.delete(
    '/menus',
    {
      schema: {
        tags: ['Menus'],
        description: '批量删除菜单',
        body: BatchDeleteMenusRequestSchema,
        response: { 200: ApiResponseSchema(z.null()).describe('删除成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await menuService.batchDeleteMenus(request.body);
      return ApiResponse.success(null);
    },
  );

  // ─── 分组 ──────────────────────────────────────────

  // 菜单分组列表
  app.get(
    '/menus/:id/groups',
    {
      schema: {
        tags: ['Menus'],
        description: '获取菜单分组列表',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: { 200: ApiResponseSchema(MenuGroupListResponseSchema).describe('分组列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await menuService.getMenuGroupList(request.params.id);
      return ApiResponse.success(data);
    },
  );

  // 新增菜单分组
  app.post(
    '/menus/:id/groups',
    {
      schema: {
        tags: ['Menus'],
        description: '新增菜单分组',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: CreateMenuGroupRequestSchema,
        response: { 200: ApiResponseSchema(CreateMenuGroupResponseSchema).describe('创建成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await menuService.createMenuGroup(request.params.id, request.body);
      return ApiResponse.success(data);
    },
  );

  // 更新菜单分组
  app.put(
    '/menus/groups/:id',
    {
      schema: {
        tags: ['Menus'],
        description: '更新菜单分组',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateMenuGroupRequestSchema,
        response: { 200: ApiResponseSchema(UpdateMenuGroupResponseSchema).describe('更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await menuService.updateMenuGroup(request.params.id, request.body);
      return ApiResponse.success(data);
    },
  );

  // 批量删除菜单分组
  app.delete(
    '/menus/groups',
    {
      schema: {
        tags: ['Menus'],
        description: '批量删除菜单分组',
        body: BatchDeleteMenuGroupsRequestSchema,
        response: { 200: ApiResponseSchema(z.null()).describe('删除成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await menuService.batchDeleteMenuGroups(request.body);
      return ApiResponse.success(null);
    },
  );

  // ─── 商品 ──────────────────────────────────────────

  // 分组商品列表
  app.get(
    '/menus/groups/:id/products',
    {
      schema: {
        tags: ['Menus'],
        description: '获取分组商品列表',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        response: { 200: ApiResponseSchema(MenuProductListResponseSchema).describe('商品列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await menuService.getMenuProductList(request.params.id);
      return ApiResponse.success(data);
    },
  );

  // 添加商品到分组
  app.post(
    '/menus/groups/:id/products',
    {
      schema: {
        tags: ['Menus'],
        description: '添加商品到分组',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: AddMenuProductRequestSchema,
        response: { 200: ApiResponseSchema(z.null()).describe('绑定成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await menuService.addMenuProduct(request.params.id, request.body);
      return ApiResponse.success(null);
    },
  );

  // 批量从分组移除商品
  app.delete(
    '/menus/groups/:id/products',
    {
      schema: {
        tags: ['Menus'],
        description: '批量从分组移除商品',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: BatchRemoveMenuProductsRequestSchema,
        response: { 200: ApiResponseSchema(z.null()).describe('解绑成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await menuService.batchRemoveMenuProducts(request.params.id, request.body);
      return ApiResponse.success(null);
    },
  );

  // 更新分组商品排序
  app.put(
    '/menus/groups/:id/products/sort',
    {
      schema: {
        tags: ['Menus'],
        description: '更新分组商品排序',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: UpdateMenuProductSortRequestSchema,
        response: { 200: ApiResponseSchema(z.null()).describe('排序更新成功') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      await menuService.updateMenuProductSort(request.params.id, request.body);
      return ApiResponse.success(null);
    },
  );

  // ─── 门店关联 ──────────────────────────────────────

  // 获取菜单关联的门店列表
  app.get(
    '/menus/:id/stores',
    {
      schema: {
        tags: ['Menus'],
        description: '获取菜单关联的门店列表',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        querystring: MenuStoreListRequestSchema,
        response: { 200: ApiResponseSchema(MenuStoreListResponseSchema).describe('门店列表') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await menuService.getMenuStoreList(request.params.id, request.query);
      return ApiResponse.success(data);
    },
  );

  // 按地域分发菜单
  app.post(
    '/menus/:id/dispatch/area',
    {
      schema: {
        tags: ['Menus'],
        description: '按地域分发菜单到匹配的门店',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: DispatchByAreaRequestSchema,
        response: { 200: ApiResponseSchema(DispatchByAreaResponseSchema).describe('分发结果') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await menuService.dispatchByArea(request.params.id, request.body);
      return ApiResponse.success(data);
    },
  );

  // 按ID分发菜单
  app.post(
    '/menus/:id/dispatch/id',
    {
      schema: {
        tags: ['Menus'],
        description: '按ID分发菜单到指定门店',
        params: z.object({ id: z.coerce.number().int().positive('ID 必须为正整数') }),
        body: DispatchByIdRequestSchema,
        response: { 200: ApiResponseSchema(DispatchByIdResponseSchema).describe('分发结果') },
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, _reply) => {
      const data = await menuService.dispatchById(request.params.id, request.body);
      return ApiResponse.success(data);
    },
  );
};
