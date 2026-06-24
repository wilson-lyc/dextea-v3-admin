import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { productsTable } from '../db/schema.js';
import { AppError } from '../errorcode/index.js';
import { productErrors } from '../errorcode/products.js';
import type {
  ApiResponse,
  PaginatedData,
  Product,
  ProductQuery,
  CreateProductInput,
  CreateProductResponse,
} from '@dextea/shared-types';


export async function productRoutes(app: FastifyInstance) {
  /**
   * 商品列表
   * url：/api/v1/products
   */
  app.get<{
    Querystring: ProductQuery;
    Reply: ApiResponse<PaginatedData<Product>>;
  }>('/products', async (request, reply) => {
    try {
      const db = await getDb();
      const page = Math.max(1, parseInt(request.query.page ?? '1', 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? '20', 10)));
      const offset = (page - 1) * pageSize;
      const keyword = request.query.keyword;

      let query = db
        .select()
        .from(productsTable)
        .$dynamic();

      let countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(productsTable)
        .$dynamic();

      if (keyword) {
        const pattern = `%${keyword}%`;
        const filter = sql`${productsTable.name} like ${pattern}`;
        query = query.where(filter);
        countQuery = countQuery.where(filter);
      }

      const items = await query
        .limit(pageSize)
        .offset(offset)
        .orderBy(productsTable.id);

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
      throw new AppError(productErrors.LIST_FAILED);
    }
  });

  /**
   * 新增商品
   * url：/api/v1/products
   */
  app.post<{
    Body: CreateProductInput;
    Reply: ApiResponse<CreateProductResponse>;
  }>('/products', async (request, reply) => {
    try {
      const db = await getDb();
      const { name, brief, description, price, status } = request.body;

      if (!name) {
        throw new AppError(productErrors.NAME_REQUIRED);
      }

      if (price !== undefined && price < 0) {
        throw new AppError(productErrors.PRICE_INVALID);
      }

      const result = await db.insert(productsTable).values({
        name,
        brief: brief ?? '',
        description: description ?? '',
        price: price ?? 0,
        status: status ?? 1,
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
      throw new AppError(productErrors.CREATE_FAILED);
    }
  });
}
