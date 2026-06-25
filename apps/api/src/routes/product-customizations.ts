import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import {
  productCustomizationsTable,
  productCustomizationRelationsTable,
  productsTable,
} from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import { productCustomizationErrors } from '../errorcode/product-customizations.js';
import { parsePositiveInt, validateMaxLength } from '../utils/validation.js';
import type {
  ApiResponse,
  PaginatedData,
  ProductCustomization,
  CreateProductCustomizationInput,
  ProductCustomizationQuery,
} from '@dextea/shared-types';

export async function productCustomizationRoutes(app: FastifyInstance) {
  /**
   * 客制化项目列表
   * GET /api/v1/product-customizations
   */
  app.get<{
    Querystring: ProductCustomizationQuery;
    Reply: ApiResponse<PaginatedData<ProductCustomization>>;
  }>('/product-customizations', async (request) => {
    try {
      const db = await getDb();
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(productCustomizationsTable);

      const total = Number(countResult[0]?.count ?? 0);

      const items = await db
        .select()
        .from(productCustomizationsTable)
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

  /**
   * 客制化项目详情
   * GET /api/v1/product-customizations/:id
   */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<ProductCustomization>;
  }>('/product-customizations/:id', async (request) => {
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

  /**
   * 创建客制化项目
   * POST /api/v1/product-customizations
   */
  app.post<{
    Body: CreateProductCustomizationInput;
    Reply: ApiResponse<ProductCustomization>;
  }>('/product-customizations', async (request, reply) => {
    try {
      const db = await getDb();
      const { name, displayName } = request.body;

      if (!name || !name.trim()) {
        throw new AppError(productCustomizationErrors.NAME_REQUIRED);
      }

      if (!displayName || !displayName.trim()) {
        throw new AppError(productCustomizationErrors.DISPLAY_NAME_REQUIRED);
      }

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

      reply.code(201);
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

  /**
   * 获取绑定的商品列表
   * GET /api/v1/product-customizations/:id/products
   */
  app.get<{
    Params: { id: string };
    Reply: ApiResponse<{ productId: number; productName: string }[]>;
  }>('/product-customizations/:id/products', async (request) => {
    try {
      const db = await getDb();
      const customizationId = parsePositiveInt(request.params.id, '客制化项目ID');

      const rows = await db
        .select({
          productId: productCustomizationRelationsTable.productId,
          productName: productsTable.name,
        })
        .from(productCustomizationRelationsTable)
        .innerJoin(productsTable, eq(productCustomizationRelationsTable.productId, productsTable.id))
        .where(eq(productCustomizationRelationsTable.customizationId, customizationId))
        .orderBy(productCustomizationRelationsTable.productId);

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

  /**
   * 绑定商品到客制化项目
   * POST /api/v1/product-customizations/:id/products
   */
  app.post<{
    Params: { id: string };
    Body: { productId: number };
    Reply: ApiResponse<null>;
  }>('/product-customizations/:id/products', async (request) => {
    try {
      const db = await getDb();
      const customizationId = parsePositiveInt(request.params.id, '客制化项目ID');
      const { productId } = request.body;

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

      await db.insert(productCustomizationRelationsTable).values({ productId, customizationId });

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

  /**
   * 解绑商品
   * DELETE /api/v1/product-customizations/:id/products/:productId
   */
  app.delete<{
    Params: { id: string; productId: string };
    Reply: ApiResponse<null>;
  }>('/product-customizations/:id/products/:productId', async (request) => {
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
}
