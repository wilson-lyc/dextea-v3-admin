import type { MySql2Database } from 'drizzle-orm/mysql2';

type DbClient = MySql2Database<Record<string, unknown>>;
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  productsTable,
  productTagRelationsTable,
  productTagsTable,
  productIngredientRelationsTable,
  ingredientsTable,
} from '../plugins/db/mysql/schema.js';
import { BizError } from '@/common/exceptions/index.js';
import { ProductErrorCodes } from '@/module/products/product.errorcode.js';
import { TagErrorCodes } from '@/module/tags/tag.errorcode.js';
import { validateMaxLength, validatePrice, validateStatus } from '../plugins/utils/validation.js';
import type { PaginatedData, Product, ProductTag } from '@dextea/shared-types';
import { PRODUCT_STATUS_VALUES } from '@dextea/shared-types';

// ─── Types ──────────────────────────────────────────

export interface ListProductsParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: number;
  priceMin?: number;
  priceMax?: number;
  tagIds?: number[];
}

export interface CreateProductServiceInput {
  name: string;
  brief?: string;
  description?: string;
  price?: number;
  status?: number;
  tagIds?: number[];
}

// ─── Functions ──────────────────────────────────────

/**
 * 商品列表（分页 + 多条件筛选 + 标签关联）
 */
export async function listProducts(
  db: DbClient,
  params: ListProductsParams,
): Promise<PaginatedData<Product>> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const offset = (page - 1) * pageSize;
  const keyword = params.keyword?.trim();

  const baseQuery = db.select().from(productsTable);
  const countQuery = db.select({ count: sql<number>`count(*)` }).from(productsTable);

  // 关键词筛选
  if (keyword) {
    const pattern = `%${keyword}%`;
    const filter = sql`${productsTable.name} like ${pattern}`;
    baseQuery.where(filter);
    countQuery.where(filter);
  }

  // 状态筛选
  if (params.status !== undefined) {
    const validValues = PRODUCT_STATUS_VALUES as readonly number[];
    if (validValues.includes(params.status)) {
      baseQuery.where(eq(productsTable.status, params.status));
      countQuery.where(eq(productsTable.status, params.status));
    }
  }

  // 价格范围筛选
  if (params.priceMin !== undefined && params.priceMin >= 0) {
    baseQuery.where(sql`${productsTable.price} >= ${params.priceMin}`);
    countQuery.where(sql`${productsTable.price} >= ${params.priceMin}`);
  }
  if (params.priceMax !== undefined && params.priceMax >= 0) {
    baseQuery.where(sql`${productsTable.price} <= ${params.priceMax}`);
    countQuery.where(sql`${productsTable.price} <= ${params.priceMax}`);
  }

  // 标签筛选：查找同时拥有所有指定标签的商品
  if (params.tagIds && params.tagIds.length > 0) {
    const matchingProductIds = await db
      .select({ productId: productTagRelationsTable.productId })
      .from(productTagRelationsTable)
      .where(inArray(productTagRelationsTable.tagId, params.tagIds))
      .groupBy(productTagRelationsTable.productId)
      .having(sql`count(distinct ${productTagRelationsTable.tagId}) = ${params.tagIds.length}`);

    const productIdSet = matchingProductIds.map(r => r.productId);
    if (productIdSet.length > 0) {
      baseQuery.where(inArray(productsTable.id, productIdSet));
      countQuery.where(inArray(productsTable.id, productIdSet));
    } else {
      baseQuery.where(sql`1 = 0`);
      countQuery.where(sql`1 = 0`);
    }
  }

  const [items, countResult] = await Promise.all([
    baseQuery.limit(pageSize).offset(offset).orderBy(productsTable.id),
    countQuery,
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  // 批量获取标签并挂载
  if (items.length > 0) {
    const productIds = items.map(p => p.id);
    const tagRelations = await db
      .select({
        productId: productTagRelationsTable.productId,
        tagId: productTagsTable.id,
        tagName: productTagsTable.name,
      })
      .from(productTagRelationsTable)
      .innerJoin(productTagsTable, eq(productTagRelationsTable.tagId, productTagsTable.id))
      .where(inArray(productTagRelationsTable.productId, productIds));

    const tagsByProductId = new Map<number, { id: number; name: string }[]>();
    for (const rel of tagRelations) {
      if (!tagsByProductId.has(rel.productId)) {
        tagsByProductId.set(rel.productId, []);
      }
      tagsByProductId.get(rel.productId)!.push({ id: rel.tagId, name: rel.tagName });
    }

    for (const product of items) {
      (product as Product).tags = tagsByProductId.get(product.id) ?? [];
    }
  }

  return { items, total, page, pageSize };
}

/**
 * 商品基础信息
 */
export async function getProductBasicInfo(
  db: DbClient,
  id: number,
): Promise<Product> {
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1);

  if (!product) {
    throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
  }

  return product as Product;
}

/**
 * 创建商品（可选绑定标签）
 */
export async function createProduct(
  db: DbClient,
  input: CreateProductServiceInput,
): Promise<{ id: number }> {
  const { name, brief, description, price, status, tagIds } = input;

  validateMaxLength(name, 255, '商品名称');
  validateMaxLength(brief, 500, '简介');
  validateMaxLength(description, 2000, '描述');

  if (price !== undefined) {
    validatePrice(price);
  }
  if (status !== undefined) {
    validateStatus(status, PRODUCT_STATUS_VALUES, '商品状态');
  }

  const result = await db.insert(productsTable).values({
    name,
    brief: brief ?? '',
    description: description ?? '',
    price: price ?? 0,
    status: status ?? 0,
  });

  const insertId = Number(result[0]?.insertId ?? 0);

  if (tagIds && tagIds.length > 0) {
    await db.insert(productTagRelationsTable).values(
      tagIds.map(tagId => ({
        productId: insertId,
        tagId,
      })),
    );
  }

  return { id: insertId };
}

/**
 * 更新商品信息
 */
export async function updateProduct(
  db: DbClient,
  id: number,
  input: Partial<CreateProductServiceInput>,
): Promise<Product> {
  const { name, brief, description, price, status } = input;

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1);

  if (!product) {
    throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
  }

  if (name !== undefined) {
    if (!name) throw new BizError(ProductErrorCodes.NAME_REQUIRED);
    validateMaxLength(name, 255, '商品名称');
  }
  validateMaxLength(brief, 500, '简介');
  validateMaxLength(description, 2000, '描述');

  if (price !== undefined) {
    validatePrice(price);
  }
  if (status !== undefined) {
    validateStatus(status, PRODUCT_STATUS_VALUES, '商品状态');
  }

  const updateData: Partial<typeof productsTable.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (brief !== undefined) updateData.brief = brief;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (status !== undefined) updateData.status = status;

  if (Object.keys(updateData).length > 0) {
    await db
      .update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, id));
  }

  const [updated] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1);

  return updated as Product;
}

/**
 * 更新商品状态（上下架）
 */
export async function updateProductStatus(
  db: DbClient,
  id: number,
  status: number,
): Promise<Product> {
  validateStatus(status, PRODUCT_STATUS_VALUES, '商品状态');

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1);

  if (!product) {
    throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
  }

  await db
    .update(productsTable)
    .set({ status })
    .where(eq(productsTable.id, id));

  const [updated] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id))
    .limit(1);

  return updated as Product;
}

/**
 * 获取商品标签列表（分页）
 */
export async function getProductTags(
  db: DbClient,
  id: number,
  page: number,
  pageSize: number,
): Promise<PaginatedData<ProductTag>> {
  page = Math.max(1, page);
  pageSize = Math.min(100, Math.max(1, pageSize));
  const offset = (page - 1) * pageSize;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productTagRelationsTable)
    .where(eq(productTagRelationsTable.productId, id));

  const total = Number(countResult?.count ?? 0);

  const tags = await db
    .select({
      id: productTagsTable.id,
      name: productTagsTable.name,
    })
    .from(productTagRelationsTable)
    .innerJoin(productTagsTable, eq(productTagRelationsTable.tagId, productTagsTable.id))
    .where(eq(productTagRelationsTable.productId, id))
    .orderBy(productTagsTable.id)
    .limit(pageSize)
    .offset(offset);

  return { items: tags, total, page, pageSize };
}

/**
 * 批量绑定标签到商品
 * 检查商品存在、标签存在、过滤已绑定关系后写入新关系
 */
export async function bindTagToProduct(
  db: DbClient,
  productId: number,
  tagIds: number[],
): Promise<{ boundCount: number }> {
  const uniqueIds = [...new Set(tagIds)];

  // 检查商品是否存在
  const [product] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.id, productId))
    .limit(1);

  if (!product) {
    throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
  }

  // 检查所有标签是否存在
  const existingTags = await db
    .select({ id: productTagsTable.id })
    .from(productTagsTable)
    .where(inArray(productTagsTable.id, uniqueIds));

  if (existingTags.length !== uniqueIds.length) {
    throw new BizError(TagErrorCodes.TAG_NOT_FOUND);
  }

  // 过滤已绑定的标签
  const existingBindings = await db
    .select({ tagId: productTagRelationsTable.tagId })
    .from(productTagRelationsTable)
    .where(
      and(
        eq(productTagRelationsTable.productId, productId),
        inArray(productTagRelationsTable.tagId, uniqueIds),
      ),
    );

  const boundTagIds = new Set(existingBindings.map(r => r.tagId));
  const toInsert = uniqueIds.filter(tid => !boundTagIds.has(tid));

  if (toInsert.length === 0) {
    throw new BizError(ProductErrorCodes.TAG_ALREADY_EXISTS);
  }

  await db.insert(productTagRelationsTable).values(
    toInsert.map(tagId => ({ productId, tagId })),
  );

  return { boundCount: toInsert.length };
}

/**
 * 批量解绑商品标签
 */
export async function unbindTagFromProduct(
  db: DbClient,
  productId: number,
  tagIds: number[],
): Promise<void> {
  await db
    .delete(productTagRelationsTable)
    .where(
      and(
        eq(productTagRelationsTable.productId, productId),
        inArray(productTagRelationsTable.tagId, tagIds),
      ),
    );
}

/**
 * 获取商品绑定的原料列表（分页）
 */
export async function getProductIngredients(
  db: DbClient,
  productId: number,
  page: number,
  pageSize: number,
): Promise<PaginatedData<{ ingredientId: number; ingredientName: string; unit: string; quantity: number }>> {
  page = Math.max(1, page);
  pageSize = Math.min(100, Math.max(1, pageSize));
  const offset = (page - 1) * pageSize;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productIngredientRelationsTable)
    .where(eq(productIngredientRelationsTable.productId, productId));

  const total = Number(countResult?.count ?? 0);

  const rows = await db
    .select({
      ingredientId: productIngredientRelationsTable.ingredientId,
      ingredientName: ingredientsTable.name,
      unit: ingredientsTable.unit,
      quantity: productIngredientRelationsTable.quantity,
    })
    .from(productIngredientRelationsTable)
    .innerJoin(ingredientsTable, eq(productIngredientRelationsTable.ingredientId, ingredientsTable.id))
    .where(eq(productIngredientRelationsTable.productId, productId))
    .orderBy(productIngredientRelationsTable.ingredientId)
    .limit(pageSize)
    .offset(offset);

  return { items: rows, total, page, pageSize };
}

/**
 * 绑定原料到商品
 * 检查原料存在、检查不重复绑定后写入
 */
export async function bindIngredientToProduct(
  db: DbClient,
  productId: number,
  ingredientId: number,
  quantity?: number,
): Promise<void> {
  const [ingredient] = await db
    .select({ id: ingredientsTable.id })
    .from(ingredientsTable)
    .where(eq(ingredientsTable.id, ingredientId))
    .limit(1);

  if (!ingredient) {
    throw new BizError(ProductErrorCodes.INGREDIENT_NOT_FOUND);
  }

  const [existing] = await db
    .select()
    .from(productIngredientRelationsTable)
    .where(
      and(
        eq(productIngredientRelationsTable.productId, productId),
        eq(productIngredientRelationsTable.ingredientId, ingredientId),
      ),
    )
    .limit(1);

  if (existing) {
    throw new BizError(ProductErrorCodes.INGREDIENT_ALREADY_BOUND);
  }

  await db.insert(productIngredientRelationsTable).values({
    productId,
    ingredientId,
    quantity: quantity ?? 0,
  });
}

/**
 * 更新绑定原料的用量
 */
export async function updateIngredientQuantity(
  db: DbClient,
  productId: number,
  ingredientId: number,
  quantity: number,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(productIngredientRelationsTable)
    .where(
      and(
        eq(productIngredientRelationsTable.productId, productId),
        eq(productIngredientRelationsTable.ingredientId, ingredientId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new BizError(ProductErrorCodes.INGREDIENT_BIND_NOT_FOUND);
  }

  await db
    .update(productIngredientRelationsTable)
    .set({ quantity })
    .where(
      and(
        eq(productIngredientRelationsTable.productId, productId),
        eq(productIngredientRelationsTable.ingredientId, ingredientId),
      ),
    );
}

/**
 * 解绑原料
 */
export async function unbindIngredientFromProduct(
  db: DbClient,
  productId: number,
  ingredientId: number,
): Promise<void> {
  await db
    .delete(productIngredientRelationsTable)
    .where(
      and(
        eq(productIngredientRelationsTable.productId, productId),
        eq(productIngredientRelationsTable.ingredientId, ingredientId),
      ),
    );
}

/**
 * 商品选项列表（供 SelectPicker 使用）
 */
export async function getProductOptions(
  db: DbClient,
): Promise<Array<{ label: string; value: string }>> {
  const rows = await db
    .select({
      label: productsTable.name,
      value: sql<string>`cast(${productsTable.id} as char)`,
    })
    .from(productsTable)
    .orderBy(productsTable.id);

  return rows;
}
