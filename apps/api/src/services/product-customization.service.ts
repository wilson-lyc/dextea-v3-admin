import type { MySql2Database } from 'drizzle-orm/mysql2';

type Db = MySql2Database<Record<string, unknown>>;
import { eq, sql } from 'drizzle-orm';
import {
  productCustomizationsTable,
  productsTable,
  customizationOptionsTable,
  ingredientsTable,
} from '../plugins/db/mysql/schema.js';
import { BizError } from '@/common/exceptions/index.js';
import { ProductCustomizationErrorCodes } from '@/module/product-customizations/product-customization.errorcode.js';
import { validateMaxLength } from '../plugins/utils/validation.js';
import type { PaginatedData, ProductCustomization, CustomizationOption } from '@dextea/shared-types';
import {
  PRODUCT_CUSTOMIZATION_STATUS_VALUES,
  CUSTOMIZATION_OPTION_STATUS_VALUES,
} from '@dextea/shared-types';
import type {
  CreateProductCustomizationInput,
  UpdateProductCustomizationInput,
  CreateCustomizationOptionInput,
  UpdateCustomizationOptionInput,
} from '@dextea/shared-types';

// ─── Types ──────────────────────────────────────────

export interface ListCustomizationsParams {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: number;
  productId?: number;
}

// ─── Customization CRUD ─────────────────────────────

/**
 * 客制化项目列表（分页 + 多条件筛选 + optionCount 子查询）
 */
export async function listCustomizations(
  db: Db,
  params: ListCustomizationsParams,
): Promise<PaginatedData<ProductCustomization>> {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(100, Math.max(1, params.pageSize));
  const offset = (page - 1) * pageSize;
  const keyword = params.keyword?.trim();

  const conditions: ReturnType<typeof sql>[] = [];
  if (keyword) {
    const pattern = `%${keyword}%`;
    conditions.push(sql`${productCustomizationsTable.name} like ${pattern}`);
  }
  if (params.status !== undefined) {
    conditions.push(eq(productCustomizationsTable.status, params.status));
  }
  if (params.productId !== undefined) {
    conditions.push(eq(productCustomizationsTable.productId, params.productId));
  }

  const whereClause = conditions.length > 0
    ? sql`${conditions.reduce((acc, c) => sql`${acc} and ${c}`)}`
    : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(productCustomizationsTable)
    .where(whereClause);

  const total = Number(countResult[0]?.count ?? 0);

  const items = await db
    .select({
      id: productCustomizationsTable.id,
      productId: productCustomizationsTable.productId,
      name: productCustomizationsTable.name,
      status: productCustomizationsTable.status,
      optionCount: sql<number>`(select count(*) from ${customizationOptionsTable} where ${customizationOptionsTable.customizationId} = ${productCustomizationsTable.id})`,
      createdAt: productCustomizationsTable.createdAt,
      updatedAt: productCustomizationsTable.updatedAt,
    })
    .from(productCustomizationsTable)
    .where(whereClause)
    .orderBy(productCustomizationsTable.id)
    .limit(pageSize)
    .offset(offset);

  return { items, total, page, pageSize };
}

/**
 * 客制化项目详情
 */
export async function getCustomization(
  db: Db,
  id: number,
): Promise<ProductCustomization> {
  const [item] = await db
    .select()
    .from(productCustomizationsTable)
    .where(eq(productCustomizationsTable.id, id))
    .limit(1);

  if (!item) {
    throw new BizError(ProductCustomizationErrorCodes.NOT_FOUND);
  }

  return item as ProductCustomization;
}

/**
 * 创建客制化项目
 * 检查关联商品存在后写入
 */
export async function createCustomization(
  db: Db,
  input: CreateProductCustomizationInput,
): Promise<ProductCustomization> {
  const { productId, name } = input;

  // 检查商品是否存在
  const [product] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.id, productId))
    .limit(1);

  if (!product) {
    throw new BizError(ProductCustomizationErrorCodes.PRODUCT_NOT_FOUND);
  }

  const trimmedName = name.trim();
  validateMaxLength(trimmedName, 255, '客制化项目名称');

  const result = await db.insert(productCustomizationsTable).values({
    productId,
    name: trimmedName,
  });

  const insertId = Number(result[0]?.insertId ?? 0);

  const [created] = await db
    .select()
    .from(productCustomizationsTable)
    .where(eq(productCustomizationsTable.id, insertId))
    .limit(1);

  return created as ProductCustomization;
}

/**
 * 更新客制化项目基础信息
 * 只更新提供的字段
 */
export async function updateCustomization(
  db: Db,
  id: number,
  input: UpdateProductCustomizationInput,
): Promise<ProductCustomization> {
  const { name, status } = input;

  const [existing] = await db
    .select()
    .from(productCustomizationsTable)
    .where(eq(productCustomizationsTable.id, id))
    .limit(1);

  if (!existing) {
    throw new BizError(ProductCustomizationErrorCodes.NOT_FOUND);
  }

  const trimmedName = name.trim();
  validateMaxLength(trimmedName, 255, '客制化项目名称');

  const updateData: Record<string, unknown> = {
    name: trimmedName,
  };
  if (status !== undefined) {
    const validValues = PRODUCT_CUSTOMIZATION_STATUS_VALUES as readonly number[];
    if (validValues.includes(status)) {
      updateData.status = status;
    }
  }

  await db
    .update(productCustomizationsTable)
    .set(updateData)
    .where(eq(productCustomizationsTable.id, id));

  const [updated] = await db
    .select()
    .from(productCustomizationsTable)
    .where(eq(productCustomizationsTable.id, id))
    .limit(1);

  return updated as ProductCustomization;
}

/**
 * 单独更新客制化项目状态
 */
export async function updateCustomizationStatus(
  db: Db,
  id: number,
  status: number,
): Promise<ProductCustomization> {
  const validValues = PRODUCT_CUSTOMIZATION_STATUS_VALUES as readonly number[];
  if (!validValues.includes(status)) {
    throw new BizError(ProductCustomizationErrorCodes.INVALID_STATUS);
  }

  const [existing] = await db
    .select()
    .from(productCustomizationsTable)
    .where(eq(productCustomizationsTable.id, id))
    .limit(1);

  if (!existing) {
    throw new BizError(ProductCustomizationErrorCodes.NOT_FOUND);
  }

  await db
    .update(productCustomizationsTable)
    .set({ status })
    .where(eq(productCustomizationsTable.id, id));

  const [updated] = await db
    .select()
    .from(productCustomizationsTable)
    .where(eq(productCustomizationsTable.id, id))
    .limit(1);

  return updated as ProductCustomization;
}

// ─── Option management ──────────────────────────────

/**
 * 获取客制化选项列表（无分页，返回全部）
 * 左连 ingredientsTable 获取原料名称
 */
export async function getCustomizationOptions(
  db: Db,
  customizationId: number,
): Promise<CustomizationOption[]> {
  const options = await db
    .select({
      id: customizationOptionsTable.id,
      customizationId: customizationOptionsTable.customizationId,
      name: customizationOptionsTable.name,
      price: customizationOptionsTable.price,
      sort: customizationOptionsTable.sort,
      status: customizationOptionsTable.status,
      ingredientId: customizationOptionsTable.ingredientId,
      ingredientName: sql<string>`coalesce(${ingredientsTable.name}, '')`,
      quantity: customizationOptionsTable.quantity,
      createdAt: customizationOptionsTable.createdAt,
      updatedAt: customizationOptionsTable.updatedAt,
    })
    .from(customizationOptionsTable)
    .leftJoin(ingredientsTable, eq(customizationOptionsTable.ingredientId, ingredientsTable.id))
    .where(eq(customizationOptionsTable.customizationId, customizationId))
    .orderBy(customizationOptionsTable.sort, customizationOptionsTable.id);

  return options as CustomizationOption[];
}

/**
 * 创建客制化选项
 * 如果提供了 ingredientId，校验原料是否存在
 * 左连 ingredientsTable 返回原料名称
 */
export async function createCustomizationOption(
  db: Db,
  customizationId: number,
  input: CreateCustomizationOptionInput,
): Promise<CustomizationOption> {
  const { name, price, sort, ingredientId, quantity } = input;

  const trimmedName = name.trim();
  validateMaxLength(trimmedName, 255, '客制化选项名称');

  if (ingredientId != null) {
    const [ingredient] = await db
      .select({ id: ingredientsTable.id })
      .from(ingredientsTable)
      .where(eq(ingredientsTable.id, ingredientId))
      .limit(1);
    if (!ingredient) {
      throw new BizError(ProductCustomizationErrorCodes.INGREDIENT_NOT_FOUND);
    }
  }

  const result = await db.insert(customizationOptionsTable).values({
    customizationId,
    name: trimmedName,
    price: price ?? 0,
    sort: sort ?? 0,
    ingredientId: ingredientId ?? null,
    quantity: quantity ?? 0,
  });

  const insertId = Number(result[0]?.insertId ?? 0);

  const [created] = await db
    .select({
      id: customizationOptionsTable.id,
      customizationId: customizationOptionsTable.customizationId,
      name: customizationOptionsTable.name,
      price: customizationOptionsTable.price,
      sort: customizationOptionsTable.sort,
      status: customizationOptionsTable.status,
      ingredientId: customizationOptionsTable.ingredientId,
      ingredientName: sql<string>`coalesce(${ingredientsTable.name}, '')`,
      quantity: customizationOptionsTable.quantity,
      createdAt: customizationOptionsTable.createdAt,
      updatedAt: customizationOptionsTable.updatedAt,
    })
    .from(customizationOptionsTable)
    .leftJoin(ingredientsTable, eq(customizationOptionsTable.ingredientId, ingredientsTable.id))
    .where(eq(customizationOptionsTable.id, insertId))
    .limit(1);

  return created as CustomizationOption;
}

/**
 * 更新客制化选项
 * 校验选项存在且属于指定客制化项目
 * 只更新提供的字段
 * 左连 ingredientsTable 返回原料名称
 */
export async function updateCustomizationOption(
  db: Db,
  customizationId: number,
  optionId: number,
  input: UpdateCustomizationOptionInput,
): Promise<CustomizationOption> {
  const { name, price, sort, status, ingredientId, quantity } = input;

  const [existing] = await db
    .select()
    .from(customizationOptionsTable)
    .where(eq(customizationOptionsTable.id, optionId))
    .limit(1);

  if (!existing || existing.customizationId !== customizationId) {
    throw new BizError(ProductCustomizationErrorCodes.OPTION_NOT_FOUND);
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) {
    const trimmedName = name.trim();
    validateMaxLength(trimmedName, 255, '客制化选项名称');
    updateData.name = trimmedName;
  }
  if (price !== undefined) updateData.price = price;
  if (sort !== undefined) updateData.sort = sort;
  if (status !== undefined) {
    const validValues = CUSTOMIZATION_OPTION_STATUS_VALUES as readonly number[];
    if (validValues.includes(status)) {
      updateData.status = status;
    }
  }
  if (ingredientId !== undefined) {
    if (ingredientId != null) {
      const [ingredient] = await db
        .select({ id: ingredientsTable.id })
        .from(ingredientsTable)
        .where(eq(ingredientsTable.id, ingredientId))
        .limit(1);
      if (!ingredient) {
        throw new BizError(ProductCustomizationErrorCodes.INGREDIENT_NOT_FOUND);
      }
    }
    updateData.ingredientId = ingredientId;
  }
  if (quantity !== undefined) updateData.quantity = quantity;

  if (Object.keys(updateData).length === 0) {
    const [current] = await db
      .select({
        id: customizationOptionsTable.id,
        customizationId: customizationOptionsTable.customizationId,
        name: customizationOptionsTable.name,
        price: customizationOptionsTable.price,
        sort: customizationOptionsTable.sort,
        status: customizationOptionsTable.status,
        ingredientId: customizationOptionsTable.ingredientId,
        ingredientName: sql<string>`coalesce(${ingredientsTable.name}, '')`,
        quantity: customizationOptionsTable.quantity,
        createdAt: customizationOptionsTable.createdAt,
        updatedAt: customizationOptionsTable.updatedAt,
      })
      .from(customizationOptionsTable)
      .leftJoin(ingredientsTable, eq(customizationOptionsTable.ingredientId, ingredientsTable.id))
      .where(eq(customizationOptionsTable.id, optionId))
      .limit(1);

    return current as CustomizationOption;
  }

  await db
    .update(customizationOptionsTable)
    .set(updateData)
    .where(eq(customizationOptionsTable.id, optionId));

  const [updated] = await db
    .select({
      id: customizationOptionsTable.id,
      customizationId: customizationOptionsTable.customizationId,
      name: customizationOptionsTable.name,
      price: customizationOptionsTable.price,
      sort: customizationOptionsTable.sort,
      status: customizationOptionsTable.status,
      ingredientId: customizationOptionsTable.ingredientId,
      ingredientName: sql<string>`coalesce(${ingredientsTable.name}, '')`,
      quantity: customizationOptionsTable.quantity,
      createdAt: customizationOptionsTable.createdAt,
      updatedAt: customizationOptionsTable.updatedAt,
    })
    .from(customizationOptionsTable)
    .leftJoin(ingredientsTable, eq(customizationOptionsTable.ingredientId, ingredientsTable.id))
    .where(eq(customizationOptionsTable.id, optionId))
    .limit(1);

  return updated as CustomizationOption;
}

/**
 * 删除客制化选项
 * 校验选项存在且属于指定客制化项目
 */
export async function deleteCustomizationOption(
  db: Db,
  customizationId: number,
  optionId: number,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(customizationOptionsTable)
    .where(eq(customizationOptionsTable.id, optionId))
    .limit(1);

  if (!existing || existing.customizationId !== customizationId) {
    throw new BizError(ProductCustomizationErrorCodes.OPTION_NOT_FOUND);
  }

  await db
    .delete(customizationOptionsTable)
    .where(eq(customizationOptionsTable.id, optionId));
}
