import type { MySql2Database } from 'drizzle-orm/mysql2';

type Db = MySql2Database<Record<string, unknown>>;
import { and, eq, inArray, sql } from 'drizzle-orm';
import { productTagsTable, productTagRelationsTable, productsTable } from '../plugins/db/mysql/schema.js';
import { BizError } from '@/common/exceptions/index.js';
import { TagErrorCodes } from '../errorcode/tags.js';
import { ProductErrorCodes } from '../errorcode/products.js';
import { validateMaxLength } from '../utils/validation.js';
import type { PaginatedData, ProductTag } from '@dextea/shared-types';

/**
 * 商品标签选项列表（供 SelectPicker 使用）
 */
export async function listTagOptions(
  db: Db,
): Promise<Array<{ label: string; value: string }>> {
  const rows = await db
    .select({
      label: productTagsTable.name,
      value: sql<string>`cast(${productTagsTable.id} as char)`,
    })
    .from(productTagsTable)
    .orderBy(productTagsTable.id);

  return rows;
}

/**
 * 商品标签列表（分页）
 *
 * 每项包含 boundCount（通过子查询统计该标签绑定的商品数量）。
 */
export async function listTags(
  db: Db,
  params: { page: number; pageSize: number },
): Promise<PaginatedData<ProductTag>> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const offset = (page - 1) * pageSize;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(productTagsTable);

  const total = Number(countResult[0]?.count ?? 0);

  const items = await db
    .select({
      id: productTagsTable.id,
      name: productTagsTable.name,
      boundCount: sql<number>`(select count(*) from ${productTagRelationsTable} where ${productTagRelationsTable.tagId} = ${productTagsTable.id})`,
      createdAt: productTagsTable.createdAt,
      updatedAt: productTagsTable.updatedAt,
    })
    .from(productTagsTable)
    .orderBy(productTagsTable.id)
    .limit(pageSize)
    .offset(offset);

  return { items, total, page, pageSize };
}

/**
 * 新增商品标签
 *
 * 校验标签名长度，检查名称是否已存在。
 */
export async function createTag(
  db: Db,
  name: string,
): Promise<ProductTag> {
  const trimmedName = name.trim();
  validateMaxLength(trimmedName, 255, '标签名称');

  const [existing] = await db
    .select()
    .from(productTagsTable)
    .where(eq(productTagsTable.name, trimmedName))
    .limit(1);

  if (existing) {
    throw new BizError(TagErrorCodes.DUPLICATE_NAME);
  }

  const result = await db
    .insert(productTagsTable)
    .values({ name: trimmedName });

  const insertId = Number(result[0]?.insertId ?? 0);

  return { id: insertId, name: trimmedName };
}

/**
 * 更新商品标签
 *
 * 校验标签存在性、标签名长度、名称是否重复（排除自身）。
 */
export async function updateTag(
  db: Db,
  id: number,
  name: string,
): Promise<ProductTag> {
  const trimmedName = name.trim();
  validateMaxLength(trimmedName, 255, '标签名称');

  const [tag] = await db
    .select()
    .from(productTagsTable)
    .where(eq(productTagsTable.id, id))
    .limit(1);

  if (!tag) {
    throw new BizError(TagErrorCodes.TAG_NOT_FOUND);
  }

  const [duplicate] = await db
    .select()
    .from(productTagsTable)
    .where(eq(productTagsTable.name, trimmedName))
    .limit(1);

  if (duplicate && duplicate.id !== id) {
    throw new BizError(TagErrorCodes.DUPLICATE_NAME);
  }

  await db
    .update(productTagsTable)
    .set({ name: trimmedName })
    .where(eq(productTagsTable.id, id));

  return { id, name: trimmedName };
}

/**
 * 获取标签绑定的商品列表（分页）
 */
export async function getTagProducts(
  db: Db,
  tagId: number,
  page: number,
  pageSize: number,
): Promise<PaginatedData<{ id: number; name: string }>> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const offset = (safePage - 1) * safePageSize;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productTagRelationsTable)
    .where(eq(productTagRelationsTable.tagId, tagId));

  const total = Number(countResult?.count ?? 0);

  const items = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
    })
    .from(productTagRelationsTable)
    .innerJoin(productsTable, eq(productTagRelationsTable.productId, productsTable.id))
    .where(eq(productTagRelationsTable.tagId, tagId))
    .orderBy(productsTable.id)
    .limit(safePageSize)
    .offset(offset);

  return { items, total, page: safePage, pageSize: safePageSize };
}

/**
 * 批量绑定商品到标签
 *
 * 校验标签存在、所有商品存在、过滤已绑定的关系后批量插入。
 */
export async function bindProductToTag(
  db: Db,
  tagId: number,
  productIds: number[],
): Promise<{ boundCount: number }> {
  const uniqueIds = [...new Set(productIds)];

  const [tag] = await db
    .select()
    .from(productTagsTable)
    .where(eq(productTagsTable.id, tagId))
    .limit(1);

  if (!tag) {
    throw new BizError(TagErrorCodes.TAG_NOT_FOUND);
  }

  const existingProducts = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(inArray(productsTable.id, uniqueIds));

  if (existingProducts.length !== uniqueIds.length) {
    throw new BizError(ProductErrorCodes.PRODUCT_NOT_FOUND);
  }

  const existingBindings = await db
    .select({ productId: productTagRelationsTable.productId })
    .from(productTagRelationsTable)
    .where(
      and(
        eq(productTagRelationsTable.tagId, tagId),
        inArray(productTagRelationsTable.productId, uniqueIds),
      ),
    );

  const boundProductIds = new Set(existingBindings.map(r => r.productId));
  const toInsert = uniqueIds.filter(pid => !boundProductIds.has(pid));

  if (toInsert.length > 0) {
    await db.insert(productTagRelationsTable).values(
      toInsert.map(productId => ({ productId, tagId })),
    );
  }

  return { boundCount: toInsert.length };
}

/**
 * 批量解绑商品标签
 */
export async function unbindProductFromTag(
  db: Db,
  tagId: number,
  productIds: number[],
): Promise<void> {
  await db
    .delete(productTagRelationsTable)
    .where(
      and(
        eq(productTagRelationsTable.tagId, tagId),
        inArray(productTagRelationsTable.productId, productIds),
      ),
    );
}

/**
 * 删除商品标签
 *
 * 先删除标签与商品的绑定关系，再删除标签本身。
 */
export async function deleteTag(
  db: Db,
  id: number,
): Promise<void> {
  const [tag] = await db
    .select()
    .from(productTagsTable)
    .where(eq(productTagsTable.id, id))
    .limit(1);

  if (!tag) {
    throw new BizError(TagErrorCodes.TAG_NOT_FOUND);
  }

  await db
    .delete(productTagRelationsTable)
    .where(eq(productTagRelationsTable.tagId, id));

  await db
    .delete(productTagsTable)
    .where(eq(productTagsTable.id, id));
}
