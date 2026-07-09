import type { MySql2Database } from 'drizzle-orm/mysql2';

type Db = MySql2Database<Record<string, unknown>>;
import { eq, sql } from 'drizzle-orm';
import {
  ingredientsTable,
  productsTable,
  productIngredientRelationsTable,
  customizationOptionsTable,
  productCustomizationsTable,
} from '../plugins/db/mysql/schema.js';
import { BizError } from '@/common/exceptions/index.js';
import { IngredientErrorCodes } from '@/module/ingredients/ingredient.errorcode.js';
import { validateMaxLength, validateStatus } from '../plugins/utils/validation.js';
import type { PaginatedData, Ingredient, CreateIngredientInput, UpdateIngredientInput } from '@dextea/shared-types';
import { INGREDIENT_STATUS_VALUES } from '@dextea/shared-types';

/**
 * 原料列表（分页 + 关键词搜索）
 * 包含商品绑定数 (boundCount) 和客制化选项绑定数 (optionCount)
 */
export async function listIngredients(
  db: Db,
  params: { page: number; pageSize: number; keyword?: string },
): Promise<PaginatedData<Ingredient>> {
  const { page, pageSize, keyword } = params;
  const offset = (page - 1) * pageSize;

  let query = db
    .select({
      id: ingredientsTable.id,
      name: ingredientsTable.name,
      unit: ingredientsTable.unit,
      status: ingredientsTable.status,
      boundCount: sql<number>`(select count(*) from ${productIngredientRelationsTable} where ${productIngredientRelationsTable.ingredientId} = ${ingredientsTable.id})`,
      optionCount: sql<number>`(select count(*) from ${customizationOptionsTable} where ${customizationOptionsTable.ingredientId} = ${ingredientsTable.id})`,
      createdAt: ingredientsTable.createdAt,
      updatedAt: ingredientsTable.updatedAt,
    })
    .from(ingredientsTable)
    .$dynamic();

  let countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(ingredientsTable)
    .$dynamic();

  if (keyword) {
    const pattern = `%${keyword}%`;
    const filter = sql`${ingredientsTable.name} like ${pattern}`;
    query = query.where(filter);
    countQuery = countQuery.where(filter);
  }

  const items = await query
    .limit(pageSize)
    .offset(offset)
    .orderBy(ingredientsTable.id);

  const countResult = await countQuery;
  const total = Number(countResult[0]?.count ?? 0);

  return { items, total, page, pageSize };
}

/**
 * 创建原料
 */
export async function createIngredient(
  db: Db,
  input: CreateIngredientInput,
): Promise<{ id: number }> {
  const { name, unit, status } = input;

  if (!name) throw new BizError(IngredientErrorCodes.NAME_REQUIRED);
  if (!unit) throw new BizError(IngredientErrorCodes.UNIT_REQUIRED);

  validateMaxLength(name, 255, '原料名称');
  validateMaxLength(unit, 50, '单位');

  if (status !== undefined) {
    validateStatus(status, INGREDIENT_STATUS_VALUES, '原料状态');
  }

  const result = await db.insert(ingredientsTable).values({
    name,
    unit,
    status: status ?? 0,
  });

  const insertId = Number(result[0]?.insertId ?? 0);
  return { id: insertId };
}

/**
 * 获取原料详情
 */
export async function getIngredient(
  db: Db,
  id: number,
): Promise<Ingredient> {
  const [ingredient] = await db
    .select({
      id: ingredientsTable.id,
      name: ingredientsTable.name,
      unit: ingredientsTable.unit,
      status: ingredientsTable.status,
      boundCount: sql<number>`(select count(*) from ${productIngredientRelationsTable} where ${productIngredientRelationsTable.ingredientId} = ${ingredientsTable.id})`,
      optionCount: sql<number>`(select count(*) from ${customizationOptionsTable} where ${customizationOptionsTable.ingredientId} = ${ingredientsTable.id})`,
      createdAt: ingredientsTable.createdAt,
      updatedAt: ingredientsTable.updatedAt,
    })
    .from(ingredientsTable)
    .where(eq(ingredientsTable.id, id))
    .limit(1);

  if (!ingredient) {
    throw new BizError(IngredientErrorCodes.INGREDIENT_NOT_FOUND);
  }

  return ingredient;
}

/**
 * 更新原料信息
 */
export async function updateIngredient(
  db: Db,
  id: number,
  input: UpdateIngredientInput,
): Promise<{ id: number }> {
  const [existing] = await db
    .select()
    .from(ingredientsTable)
    .where(eq(ingredientsTable.id, id))
    .limit(1);

  if (!existing) {
    throw new BizError(IngredientErrorCodes.INGREDIENT_NOT_FOUND);
  }

  const { name, unit, status } = input;

  if (name !== undefined) {
    if (!name) throw new BizError(IngredientErrorCodes.NAME_REQUIRED);
    validateMaxLength(name, 255, '原料名称');
  }
  if (unit !== undefined) {
    if (!unit) throw new BizError(IngredientErrorCodes.UNIT_REQUIRED);
    validateMaxLength(unit, 50, '单位');
  }
  if (status !== undefined) {
    validateStatus(status, INGREDIENT_STATUS_VALUES, '原料状态');
  }

  const updateData: Partial<typeof ingredientsTable.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (unit !== undefined) updateData.unit = unit;
  if (status !== undefined) updateData.status = status;

  if (Object.keys(updateData).length > 0) {
    await db
      .update(ingredientsTable)
      .set(updateData)
      .where(eq(ingredientsTable.id, id));
  }

  return { id };
}

/**
 * 更新原料状态
 */
export async function updateIngredientStatus(
  db: Db,
  id: number,
  status: number,
): Promise<Ingredient> {
  const [existing] = await db
    .select()
    .from(ingredientsTable)
    .where(eq(ingredientsTable.id, id))
    .limit(1);

  if (!existing) {
    throw new BizError(IngredientErrorCodes.INGREDIENT_NOT_FOUND);
  }

  validateStatus(status, INGREDIENT_STATUS_VALUES, '原料状态');

  await db
    .update(ingredientsTable)
    .set({ status })
    .where(eq(ingredientsTable.id, id));

  const [updated] = await db
    .select({
      id: ingredientsTable.id,
      name: ingredientsTable.name,
      unit: ingredientsTable.unit,
      status: ingredientsTable.status,
      boundCount: sql<number>`(select count(*) from ${productIngredientRelationsTable} where ${productIngredientRelationsTable.ingredientId} = ${ingredientsTable.id})`,
      optionCount: sql<number>`(select count(*) from ${customizationOptionsTable} where ${customizationOptionsTable.ingredientId} = ${ingredientsTable.id})`,
      createdAt: ingredientsTable.createdAt,
      updatedAt: ingredientsTable.updatedAt,
    })
    .from(ingredientsTable)
    .where(eq(ingredientsTable.id, id))
    .limit(1);

  return updated!;
}

/**
 * 获取绑定到此原料的商品列表（分页）
 */
export async function getIngredientProducts(
  db: Db,
  ingredientId: number,
  page: number,
  pageSize: number,
): Promise<PaginatedData<{ productId: number; productName: string; quantity: number }>> {
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      productId: productIngredientRelationsTable.productId,
      productName: productsTable.name,
      quantity: productIngredientRelationsTable.quantity,
    })
    .from(productIngredientRelationsTable)
    .innerJoin(productsTable, eq(productIngredientRelationsTable.productId, productsTable.id))
    .where(eq(productIngredientRelationsTable.ingredientId, ingredientId))
    .orderBy(productIngredientRelationsTable.productId)
    .limit(pageSize)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(productIngredientRelationsTable)
    .where(eq(productIngredientRelationsTable.ingredientId, ingredientId));

  const total = Number(countResult[0]?.count ?? 0);

  return { items: rows, total, page, pageSize };
}

/**
 * 绑定商品到原料
 * 校验商品存在且尚未绑定
 */
export async function bindProductToIngredient(
  db: Db,
  ingredientId: number,
  productId: number,
  quantity?: number,
): Promise<void> {
  const [product] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.id, productId))
    .limit(1);

  if (!product) {
    throw new BizError(IngredientErrorCodes.PRODUCT_NOT_FOUND);
  }

  const [existing] = await db
    .select()
    .from(productIngredientRelationsTable)
    .where(
      sql`${productIngredientRelationsTable.productId} = ${productId} and ${productIngredientRelationsTable.ingredientId} = ${ingredientId}`,
    )
    .limit(1);

  if (existing) {
    throw new BizError(IngredientErrorCodes.PRODUCT_ALREADY_BOUND);
  }

  await db.insert(productIngredientRelationsTable).values({
    productId,
    ingredientId,
    quantity: quantity ?? 0,
  });
}

/**
 * 更新绑定用量
 */
export async function updateBindQuantity(
  db: Db,
  ingredientId: number,
  productId: number,
  quantity: number,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(productIngredientRelationsTable)
    .where(
      sql`${productIngredientRelationsTable.productId} = ${productId} and ${productIngredientRelationsTable.ingredientId} = ${ingredientId}`,
    )
    .limit(1);

  if (!existing) {
    throw new BizError(IngredientErrorCodes.BIND_NOT_FOUND);
  }

  await db
    .update(productIngredientRelationsTable)
    .set({ quantity })
    .where(
      sql`${productIngredientRelationsTable.productId} = ${productId} and ${productIngredientRelationsTable.ingredientId} = ${ingredientId}`,
    );
}

/**
 * 解绑商品与原料的关联
 */
export async function unbindProductFromIngredient(
  db: Db,
  ingredientId: number,
  productId: number,
): Promise<void> {
  await db
    .delete(productIngredientRelationsTable)
    .where(
      sql`${productIngredientRelationsTable.productId} = ${productId} and ${productIngredientRelationsTable.ingredientId} = ${ingredientId}`,
    );
}

/**
 * 获取引用此原料的客制化选项列表（分页）
 */
export async function getIngredientOptions(
  db: Db,
  ingredientId: number,
  page: number,
  pageSize: number,
): Promise<PaginatedData<{ optionId: number; optionName: string; customizationName: string; quantity: number }>> {
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      optionId: customizationOptionsTable.id,
      optionName: customizationOptionsTable.name,
      customizationName: productCustomizationsTable.name,
      quantity: customizationOptionsTable.quantity,
    })
    .from(customizationOptionsTable)
    .innerJoin(productCustomizationsTable, eq(customizationOptionsTable.customizationId, productCustomizationsTable.id))
    .where(eq(customizationOptionsTable.ingredientId, ingredientId))
    .orderBy(customizationOptionsTable.id)
    .limit(pageSize)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(customizationOptionsTable)
    .where(eq(customizationOptionsTable.ingredientId, ingredientId));

  const total = Number(countResult[0]?.count ?? 0);

  return { items: rows, total, page, pageSize };
}

/**
 * 将客制化选项绑定到原料（设置选项的 ingredientId）
 */
export async function bindOptionToIngredient(
  db: Db,
  ingredientId: number,
  optionId: number,
  quantity?: number,
): Promise<void> {
  const [option] = await db
    .select({ id: customizationOptionsTable.id })
    .from(customizationOptionsTable)
    .where(eq(customizationOptionsTable.id, optionId))
    .limit(1);

  if (!option) {
    throw new BizError(IngredientErrorCodes.OPTION_NOT_FOUND);
  }

  await db
    .update(customizationOptionsTable)
    .set({ ingredientId, quantity: quantity ?? 0 })
    .where(eq(customizationOptionsTable.id, optionId));
}

/**
 * 更新客制化选项用量
 */
export async function updateOptionQuantity(
  db: Db,
  ingredientId: number,
  optionId: number,
  quantity: number,
): Promise<void> {
  const [option] = await db
    .select()
    .from(customizationOptionsTable)
    .where(eq(customizationOptionsTable.id, optionId))
    .limit(1);

  if (!option || option.ingredientId !== ingredientId) {
    throw new BizError(IngredientErrorCodes.OPTION_BIND_NOT_FOUND);
  }

  await db
    .update(customizationOptionsTable)
    .set({ quantity })
    .where(eq(customizationOptionsTable.id, optionId));
}

/**
 * 解绑客制化选项（清除选项的 ingredientId）
 */
export async function unbindOptionFromIngredient(
  db: Db,
  ingredientId: number,
  optionId: number,
): Promise<void> {
  const [option] = await db
    .select()
    .from(customizationOptionsTable)
    .where(eq(customizationOptionsTable.id, optionId))
    .limit(1);

  if (!option || option.ingredientId !== ingredientId) {
    throw new BizError(IngredientErrorCodes.OPTION_BIND_NOT_FOUND);
  }

  await db
    .update(customizationOptionsTable)
    .set({ ingredientId: null, quantity: 0 })
    .where(eq(customizationOptionsTable.id, optionId));
}

/**
 * 原料选项列表（供 SelectPicker 使用）
 */
export async function getIngredientOptionsList(
  db: Db,
): Promise<Array<{ label: string; value: string; unit: string }>> {
  const rows = await db
    .select({
      label: ingredientsTable.name,
      value: sql<string>`cast(${ingredientsTable.id} as char)`,
      unit: ingredientsTable.unit,
    })
    .from(ingredientsTable)
    .orderBy(ingredientsTable.id);

  return rows;
}
