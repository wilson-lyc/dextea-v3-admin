import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { productTagsTable } from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import { tagErrors } from '../errorcode/tags.js';
import type {
  ApiResponse,
  PaginatedData,
  ProductTag,
  CreateTagInput,
  UpdateTagInput,
  TagQuery,
} from '@dextea/shared-types';

export async function tagRoutes(app: FastifyInstance) {
  /**
   * 商品标签列表
   * GET /api/v1/tags
   */
  app.get<{
    Querystring: TagQuery;
    Reply: ApiResponse<PaginatedData<ProductTag>>;
  }>('/tags', async (request) => {
    try {
      const db = await getDb();
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(productTagsTable);

      const total = Number(countResult[0]?.count ?? 0);

      const items = await db
        .select()
        .from(productTagsTable)
        .orderBy(productTagsTable.id)
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
      throw new AppError(tagErrors.LIST_FAILED);
    }
  });

  /**
   * 新增商品标签
   * POST /api/v1/tags
   */
  app.post<{
    Body: CreateTagInput;
    Reply: ApiResponse<ProductTag>;
  }>('/tags', async (request, reply) => {
    try {
      const db = await getDb();
      const { name } = request.body;

      if (!name || !name.trim()) {
        throw new AppError(tagErrors.NAME_REQUIRED);
      }

      const trimmedName = name.trim();

      // 检查名称重复
      const [existing] = await db
        .select()
        .from(productTagsTable)
        .where(eq(productTagsTable.name, trimmedName))
        .limit(1);

      if (existing) {
        throw new AppError(tagErrors.DUPLICATE_NAME);
      }

      const result = await db
        .insert(productTagsTable)
        .values({ name: trimmedName });

      const insertId = Number(result[0]?.insertId ?? 0);

      reply.code(201);
      return {
        code: 0,
        data: { id: insertId, name: trimmedName },
        message: '创建成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(tagErrors.CREATE_FAILED);
    }
  });

  /**
   * 更新商品标签
   * PUT /api/v1/tags/:id
   */
  app.put<{
    Params: { id: string };
    Body: UpdateTagInput;
    Reply: ApiResponse<ProductTag>;
  }>('/tags/:id', async (request) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);

      if (isNaN(id)) {
        throw new AppError(tagErrors.TAG_NOT_FOUND);
      }

      const { name } = request.body;

      if (!name || !name.trim()) {
        throw new AppError(tagErrors.NAME_REQUIRED);
      }

      const trimmedName = name.trim();

      // 检查标签是否存在
      const [tag] = await db
        .select()
        .from(productTagsTable)
        .where(eq(productTagsTable.id, id))
        .limit(1);

      if (!tag) {
        throw new AppError(tagErrors.TAG_NOT_FOUND);
      }

      // 检查名称重复（排除自身）
      const [duplicate] = await db
        .select()
        .from(productTagsTable)
        .where(eq(productTagsTable.name, trimmedName))
        .limit(1);

      if (duplicate && duplicate.id !== id) {
        throw new AppError(tagErrors.DUPLICATE_NAME);
      }

      await db
        .update(productTagsTable)
        .set({ name: trimmedName })
        .where(eq(productTagsTable.id, id));

      return {
        code: 0,
        data: { id, name: trimmedName },
        message: '更新成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(tagErrors.UPDATE_FAILED);
    }
  });

  /**
   * 删除商品标签
   * DELETE /api/v1/tags/:id
   */
  app.delete<{
    Params: { id: string };
    Reply: ApiResponse<null>;
  }>('/tags/:id', async (request) => {
    try {
      const db = await getDb();
      const id = parseInt(request.params.id, 10);

      if (isNaN(id)) {
        throw new AppError(tagErrors.TAG_NOT_FOUND);
      }

      // 检查标签是否存在
      const [tag] = await db
        .select()
        .from(productTagsTable)
        .where(eq(productTagsTable.id, id))
        .limit(1);

      if (!tag) {
        throw new AppError(tagErrors.TAG_NOT_FOUND);
      }

      await db
        .delete(productTagsTable)
        .where(eq(productTagsTable.id, id));

      return {
        code: 0,
        data: null,
        message: '删除成功',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      request.log.error(error);
      throw new AppError(tagErrors.DELETE_FAILED);
    }
  });
}
