import { callRpc } from '@/infrastructure/rpc/client.js';
import { menuRepository as localMenuRepository } from '@/module/menus/menu.repository.js';

type RpcRecord = Record<string, any>;

function numberOf(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

async function page<T extends RpcRecord>(
  method: string,
  request: Record<string, unknown>,
  key: string,
): Promise<{ items: T[]; total: number; page: number; pageSize: number }> {
  const response = await callRpc<RpcRecord>('product', method, request);
  const currentPage = numberOf(request.page) || 1;
  const currentPageSize = numberOf(request.pageSize) || 20;
  return {
    items: (response[key] as T[] | undefined) ?? [],
    total: numberOf(response.total),
    page: numberOf(response.page) || currentPage,
    pageSize: numberOf(response.pageSize) || currentPageSize,
  };
}

async function all<T extends RpcRecord>(
  method: string,
  request: Record<string, unknown>,
  key: string,
): Promise<T[]> {
  const pageSize = 100;
  const first = await page<T>(method, { ...request, page: 1, pageSize }, key);
  const items = [...first.items];
  const totalPages = Math.ceil(first.total / pageSize);
  for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
    const next = await page<T>(method, { ...request, page: currentPage, pageSize }, key);
    items.push(...next.items);
  }
  return items;
}

function productView(row: RpcRecord) {
  return {
    id: numberOf(row.id),
    name: textOf(row.name),
    brief: textOf(row.brief),
    description: textOf(row.description),
    status: numberOf(row.status),
    price: numberOf(row.price),
    createdAt: textOf(row.createdAt),
    updatedAt: textOf(row.updatedAt),
  };
}

async function findProduct(id: number) {
  const products = await all<RpcRecord>('listProducts', { name: '' }, 'products');
  const product = products.find((item) => numberOf(item.id) === id);
  return product ? productView(product) : null;
}

async function listProductTags(productId: number, pageNumber: number, pageSize: number) {
  const response = await page<RpcRecord>('listProductTags', { productId, page: pageNumber, pageSize }, 'tags');
  return {
    items: response.items.map((tag) => ({ id: numberOf(tag.id), name: textOf(tag.name) })),
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
  };
}

async function listAllProductTags(productId: number) {
  return all<RpcRecord>('listProductTags', { productId }, 'tags');
}

async function listAllProducts() {
  return all<RpcRecord>('listProducts', { name: '' }, 'products');
}

function customizationItemView(row: RpcRecord) {
  return {
    id: numberOf(row.id),
    productId: numberOf(row.productId),
    name: textOf(row.name),
    sort: numberOf(row.sort),
    status: numberOf(row.status),
    createdAt: textOf(row.createdAt),
    updatedAt: textOf(row.updatedAt),
  };
}

function customizationOptionView(row: RpcRecord, ingredientName = '') {
  return {
    id: numberOf(row.id),
    itemId: numberOf(row.itemId),
    customizationId: numberOf(row.itemId),
    name: textOf(row.name),
    price: numberOf(row.price),
    sort: numberOf(row.sort),
    status: numberOf(row.status),
    ingredientId: row.ingredientId == null ? null : numberOf(row.ingredientId),
    ingredientName,
    quantity: numberOf(row.ingredientQuantity),
    createdAt: textOf(row.createdAt),
    updatedAt: textOf(row.updatedAt),
  };
}

async function listOptions(itemId: number) {
  const rows = await all<RpcRecord>('listCustomizationOptions', { itemId, name: '' }, 'options');
  return Promise.all(rows.map(async (row) => {
    if (row.ingredientId == null) return customizationOptionView(row);
    const ingredient = await callRpc<RpcRecord>('product', 'getIngredient', { id: row.ingredientId });
    return customizationOptionView(row, textOf(ingredient.name));
  }));
}

async function listAllCustomizationItems() {
  const products = await listAllProducts();
  const groups = await Promise.all(products.map((product) => all<RpcRecord>(
    'listCustomizationItems',
    { productId: numberOf(product.id), name: '' },
    'items',
  )));
  return groups.flat();
}

async function findCustomization(id: number) {
  const item = (await listAllCustomizationItems()).find((row) => numberOf(row.id) === id);
  return item ? customizationItemView(item) : null;
}

async function findOption(id: number) {
  const items = await listAllCustomizationItems();
  for (const item of items) {
    const options = await listOptions(numberOf(item.id));
    const option = options.find((row) => row.id === id);
    if (option) return option;
  }
  return null;
}

export const productRpcRepository = {
  async getProductListWithPage(pageNumber: number, pageSize: number, keyword?: string, status?: number, tagIds?: number[]) {
    const response = await page<RpcRecord>('listProducts', {
      page: pageNumber,
      pageSize,
      status,
      name: keyword ?? '',
      ...(tagIds && tagIds.length > 0 ? { tagIds } : {}),
    }, 'products');
    const items = await Promise.all(response.items.map(async (row) => ({
      ...productView(row),
      tags: (await listAllProductTags(numberOf(row.id))).map((tag) => ({ id: numberOf(tag.id), name: textOf(tag.name) })),
    })));
    return { items, total: response.total, page: response.page, pageSize: response.pageSize };
  },

  async getProductById(id: number) {
    return findProduct(id);
  },

  async getProductTagsById(id: number) {
    return (await listAllProductTags(id)).map((tag) => ({ id: numberOf(tag.id), name: textOf(tag.name) }));
  },

  async createProduct(data: RpcRecord) {
    const product = await callRpc<RpcRecord>('product', 'createProduct', {
      name: data.name,
      brief: data.brief ?? '',
      description: data.description ?? '',
      price: numberOf(data.price),
    });
    if (data.status !== undefined) {
      await callRpc('product', 'batchUpdateProductStatus', { ids: [product.id], status: numberOf(data.status) });
    }
    return numberOf(product.id);
  },

  async updateProductById(id: number, data: RpcRecord) {
    const request: RpcRecord = { id };
    for (const key of ['name', 'brief', 'description', 'price']) {
      if (data[key] !== undefined) request[key] = key === 'price' ? numberOf(data[key]) : data[key];
    }
    if (Object.keys(request).length > 1) await callRpc('product', 'updateProduct', request);
    if (data.status !== undefined) {
      await callRpc('product', 'batchUpdateProductStatus', { ids: [id], status: numberOf(data.status) });
    }
  },

  async batchUpdateProductStatus(ids: number[], status: number) {
    if (ids.length === 0) return 0;
    const response = await callRpc<RpcRecord>('product', 'batchUpdateProductStatus', { ids, status });
    return numberOf(response.updatedCount);
  },

  async getProductTagListWithPage(productId: number, pageNumber: number, pageSize: number) {
    return listProductTags(productId, pageNumber, pageSize);
  },

  async insertProductTagRelations(relations: Array<{ productId: number; tagId: number }>) {
    const byProduct = new Map<number, number[]>();
    for (const relation of relations) {
      const ids = byProduct.get(relation.productId) ?? [];
      ids.push(relation.tagId);
      byProduct.set(relation.productId, ids);
    }
    for (const [productId, tagIds] of byProduct) {
      await callRpc('product', 'bindProductTags', { productId, tagIds });
    }
  },

  async deleteProductTagRelations(productId: number, tagIds: number[]) {
    if (tagIds.length > 0) await callRpc('product', 'unbindProductTags', { productId, tagIds });
  },

  async getProductIngredientListWithPage(productId: number, pageNumber: number, pageSize: number) {
    const response = await page<RpcRecord>('listProductIngredients', { productId, page: pageNumber, pageSize }, 'ingredients');
    return {
      items: response.items.map((row) => ({
        ingredientId: numberOf(row.ingredientId),
        ingredientName: textOf(row.ingredientName),
        unit: textOf(row.unit),
        quantity: numberOf(row.quantity),
        sort: numberOf(row.sort),
      })),
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
    };
  },

  async getProductIngredientRelation(productId: number, ingredientId: number) {
    const rows = await all<RpcRecord>('listProductIngredients', { productId }, 'ingredients');
    return rows.find((row) => numberOf(row.ingredientId) === ingredientId) ?? null;
  },

  async insertProductIngredientRelation(data: RpcRecord) {
    await callRpc('product', 'bindProductIngredient', {
      productId: data.productId,
      ingredientId: data.ingredientId,
      quantity: numberOf(data.quantity),
      sort: numberOf(data.sort),
    });
  },

  async updateProductIngredientQuantity(productId: number, ingredientId: number, quantity: number) {
    await callRpc('product', 'updateProductIngredient', { productId, ingredientId, quantity });
  },

  async updateProductIngredientSort(productId: number, ingredientId: number, sort: number) {
    await callRpc('product', 'updateProductIngredient', { productId, ingredientId, sort });
  },

  async deleteProductIngredientRelation(productId: number, ingredientId: number) {
    await callRpc('product', 'deleteProductIngredient', { productId, ingredientId });
  },

  async getProductOptionSelectList() {
    return (await listAllProducts()).map((row) => ({ label: textOf(row.name), value: String(numberOf(row.id)) }));
  },

  async getTagsByIds(tagIds: number[]) {
    const tags = await all<RpcRecord>('listTags', { name: '' }, 'tags');
    return tags.filter((tag) => tagIds.includes(numberOf(tag.id))).map((tag) => ({ id: numberOf(tag.id) }));
  },

  async getIngredientById(ingredientId: number) {
    try {
      const ingredient = await callRpc<RpcRecord>('product', 'getIngredient', { id: ingredientId });
      return { id: numberOf(ingredient.id) };
    } catch {
      return null;
    }
  },

  async getProductImages(productId: number) {
    const response = await callRpc<RpcRecord>('product', 'getProductImages', { productId });
    const image = (row: RpcRecord | undefined) => row ? {
      id: numberOf(row.id),
      url: textOf(row.url),
      createdAt: textOf(row.createdAt),
    } : null;
    return {
      cover: image(response.cover),
      gallery: ((response.gallery as RpcRecord[] | undefined) ?? []).map(image).filter((item): item is { id: number; url: string; createdAt: string } => item !== null),
    };
  },

  async getGalleryImagesByIds(ids: number[]) {
    const rows = await all<RpcRecord>('listGallery', {}, 'items');
    return rows.filter((row) => ids.includes(numberOf(row.id))).map((row) => ({ id: numberOf(row.id) }));
  },

  async setProductImages(productId: number, coverImageId: number | null, galleryImageIds: number[]) {
    await callRpc('product', 'setProductImages', { productId, coverImageId, galleryImageIds });
  },
};

export const customizationRpcRepository = {
  async getCustomizationList(pageNumber: number, pageSize: number, keyword?: string, status?: number, productId?: number) {
    const response = await page<RpcRecord>('listCustomizationItems', {
      page: pageNumber,
      pageSize,
      status,
      name: keyword ?? '',
      ...(productId ? { productId } : {}),
    }, 'items');
    const items = await Promise.all(response.items.map(async (row) => {
      const options = await listOptions(numberOf(row.id));
      const activeOptionCount = options.filter((option) => option.status === 1).length;
      return {
        ...customizationItemView(row),
        optionCount: options.length,
        activeOptionCount,
        disabledOptionCount: options.length - activeOptionCount,
      };
    }));
    return { items, total: response.total, page: response.page, pageSize: response.pageSize };
  },

  async getCustomizationById(id: number) {
    return findCustomization(id);
  },

  async getProductById(id: number) {
    const product = await findProduct(id);
    return product ? { id: product.id } : null;
  },

  async createCustomization(data: RpcRecord) {
    const item = await callRpc<RpcRecord>('product', 'createCustomizationItem', {
      productId: data.productId,
      name: data.name,
      sort: numberOf(data.sort),
    });
    return numberOf(item.id);
  },

  async updateCustomizationById(id: number, data: RpcRecord) {
    const request: RpcRecord = { id };
    if (data.name !== undefined) request.name = data.name;
    if (data.sort !== undefined) request.sort = data.sort;
    if (Object.keys(request).length > 1) await callRpc('product', 'updateCustomizationItem', request);
    if (data.status !== undefined) await callRpc('product', 'batchUpdateCustomizationItemStatus', { ids: [id], status: data.status });
  },

  async updateCustomizationStatusById(id: number, status: number) {
    const response = await callRpc<RpcRecord>('product', 'batchUpdateCustomizationItemStatus', { ids: [id], status });
    return numberOf(response.updatedCount);
  },

  async getOptionList(customizationId: number) {
    return listOptions(customizationId);
  },

  async getOptionById(id: number) {
    return findOption(id);
  },

  async getOptionByIdWithIngredient(id: number) {
    return findOption(id);
  },

  async createOption(data: RpcRecord) {
    const option = await callRpc<RpcRecord>('product', 'createCustomizationOption', {
      itemId: data.itemId,
      name: data.name,
      price: numberOf(data.price),
      sort: numberOf(data.sort),
      ...(data.ingredientId != null ? { ingredientId: data.ingredientId, ingredientQuantity: numberOf(data.ingredientQuantity) } : {}),
    });
    return numberOf(option.id);
  },

  async updateOptionById(id: number, data: RpcRecord) {
    const request: RpcRecord = { id };
    if (data.name !== undefined) request.name = data.name;
    if (data.price !== undefined) request.price = numberOf(data.price);
    if (data.sort !== undefined) request.sort = data.sort;
    if (Object.keys(request).length > 1) await callRpc('product', 'updateCustomizationOption', request);

    if (data.ingredientId != null && data.ingredientQuantity !== undefined) {
      await callRpc('product', 'updateCustomizationOptionIngredient', {
        id,
        ingredientId: data.ingredientId,
        ingredientQuantity: numberOf(data.ingredientQuantity),
      });
    } else if (data.ingredientId === null) {
      await callRpc('product', 'updateCustomizationOptionIngredient', { id });
    } else if (data.ingredientQuantity !== undefined) {
      await callRpc('product', 'updateCustomizationOptionIngredient', {
        id,
        ingredientQuantity: numberOf(data.ingredientQuantity),
      });
    }
  },

  async updateOptionStatusById(id: number, status: number) {
    const response = await callRpc<RpcRecord>('product', 'batchUpdateCustomizationOptionStatus', { ids: [id], status });
    return numberOf(response.updatedCount);
  },

  async getIngredientById(id: number) {
    try {
      const ingredient = await callRpc<RpcRecord>('product', 'getIngredient', { id });
      return { id: numberOf(ingredient.id) };
    } catch {
      return null;
    }
  },

  async getCustomizationWithOptions(productId: number, ids?: number[]) {
    const response = await callRpc<RpcRecord>('product', 'exportCustomization', { productId, itemIds: ids ?? [] });
    return ((response.items as RpcRecord[] | undefined) ?? []).map((item) => ({
      name: textOf(item.name),
      options: ((item.options as RpcRecord[] | undefined) ?? []).map((option) => ({
        name: textOf(option.name),
        price: numberOf(option.price),
        sort: numberOf(option.sort),
      })),
    }));
  },

  async importCustomizations(productId: number, items: RpcRecord[], _itemStatus?: number, _optionStatus?: number) {
    const response = await callRpc<RpcRecord>('product', 'importCustomization', {
      productId,
      items: items.map((item) => ({
        name: item.name,
        sort: numberOf(item.sort),
        options: (item.options as RpcRecord[]).map((option) => ({
          name: option.name,
          price: numberOf(option.price),
          sort: numberOf(option.sort),
        })),
      })),
    });
    return {
      importedItemCount: numberOf(response.importedItemCount),
      importedOptionCount: numberOf(response.importedOptionCount),
    };
  },
};

export const ingredientRpcRepository = {
  async getIngredientList(pageNumber: number, pageSize: number, keyword?: string) {
    const response = await page<RpcRecord>('listIngredients', { page: pageNumber, pageSize, name: keyword ?? '' }, 'ingredients');
    const items = await Promise.all(response.items.map(async (row) => {
      const [products, options] = await Promise.all([
        page<RpcRecord>('listIngredientProducts', { ingredientId: row.id, page: 1, pageSize: 1 }, 'products'),
        page<RpcRecord>('listIngredientOptions', { ingredientId: row.id, page: 1, pageSize: 1 }, 'options'),
      ]);
      return { ...ingredientView(row), boundCount: products.total, optionCount: options.total };
    }));
    return { items, total: response.total, page: response.page, pageSize: response.pageSize };
  },

  async getIngredientById(id: number) {
    const row = await callRpc<RpcRecord>('product', 'getIngredient', { id });
    const [products, options] = await Promise.all([
      page<RpcRecord>('listIngredientProducts', { ingredientId: id, page: 1, pageSize: 1 }, 'products'),
      page<RpcRecord>('listIngredientOptions', { ingredientId: id, page: 1, pageSize: 1 }, 'options'),
    ]);
    return { ...ingredientView(row), boundCount: products.total, optionCount: options.total };
  },

  async getIngredientByName(name: string) {
    const rows = await all<RpcRecord>('listIngredients', { name }, 'ingredients');
    return rows.find((row) => textOf(row.name) === name) ?? null;
  },

  async createIngredient(data: RpcRecord) {
    const row = await callRpc<RpcRecord>('product', 'createIngredient', { name: data.name, unit: data.unit, status: numberOf(data.status) });
    return numberOf(row.id);
  },

  async updateIngredient(id: number, data: RpcRecord) {
    const request: RpcRecord = { id };
    for (const key of ['name', 'unit', 'status']) if (data[key] !== undefined) request[key] = data[key];
    await callRpc('product', 'updateIngredient', request);
  },

  async getIngredientProductList(ingredientId: number, pageNumber: number, pageSize: number) {
    const response = await page<RpcRecord>('listIngredientProducts', { ingredientId, page: pageNumber, pageSize }, 'products');
    return { items: response.items.map((row) => ({ productId: numberOf(row.productId), productName: textOf(row.productName), quantity: numberOf(row.quantity), sort: numberOf(row.sort) })), total: response.total, page: response.page, pageSize: response.pageSize };
  },

  async getIngredientOptionList(ingredientId: number, pageNumber: number, pageSize: number) {
    const response = await page<RpcRecord>('listIngredientOptions', { ingredientId, page: pageNumber, pageSize }, 'options');
    return { items: response.items.map((row) => ({ optionId: numberOf(row.optionId), optionName: textOf(row.optionName), customizationName: textOf(row.customizationName), quantity: numberOf(row.quantity) })), total: response.total, page: response.page, pageSize: response.pageSize };
  },

  async getIngredientOptionSelectList() {
    const response = await callRpc<RpcRecord>('product', 'listIngredientSelect', {});
    return ((response.ingredients as RpcRecord[] | undefined) ?? []).map((row) => ({ label: textOf(row.label), value: textOf(row.value), unit: textOf(row.unit) }));
  },
};

function ingredientView(row: RpcRecord) {
  return { id: numberOf(row.id), name: textOf(row.name), unit: textOf(row.unit), status: numberOf(row.status), createdAt: textOf(row.createdAt), updatedAt: textOf(row.updatedAt) };
}

export const tagRpcRepository = {
  async getTagOptions() {
    const tags = await all<RpcRecord>('listTags', { name: '' }, 'tags');
    return tags.map((tag) => ({ label: textOf(tag.name), value: String(numberOf(tag.id)) }));
  },

  async getTagList(pageNumber: number, pageSize: number) {
    const response = await page<RpcRecord>('listTags', { page: pageNumber, pageSize, name: '' }, 'tags');
    const items = await Promise.all(response.items.map(async (tag) => {
      const products = await page<RpcRecord>('listTagProducts', { tagId: tag.id, page: 1, pageSize: 1 }, 'products');
      return { id: numberOf(tag.id), name: textOf(tag.name), boundCount: products.total, createdAt: textOf(tag.createdAt), updatedAt: textOf(tag.updatedAt) };
    }));
    return { items, total: response.total, page: response.page, pageSize: response.pageSize };
  },

  async getTagById(id: number) {
    const tags = await all<RpcRecord>('listTags', { name: '' }, 'tags');
    return tags.find((tag) => numberOf(tag.id) === id) ?? null;
  },

  async getTagByName(name: string) {
    const tags = await all<RpcRecord>('listTags', { name }, 'tags');
    return tags.find((tag) => textOf(tag.name) === name) ?? null;
  },

  async createTag(name: string) {
    const tag = await callRpc<RpcRecord>('product', 'createTag', { name });
    return numberOf(tag.id);
  },

  async updateTagById(id: number, name: string) {
    await callRpc('product', 'updateTag', { id, name });
  },

  async deleteTagById(id: number) {
    await callRpc('product', 'deleteTag', { id });
  },

  async getTagProducts(tagId: number, pageNumber: number, pageSize: number) {
    const response = await page<RpcRecord>('listTagProducts', { tagId, page: pageNumber, pageSize }, 'products');
    return { items: response.items.map((row) => ({ id: numberOf(row.productId), name: textOf(row.productName) })), total: response.total, page: response.page, pageSize: response.pageSize };
  },

  async getExistingBindings(tagId: number, productIds: number[]) {
    const products = await all<RpcRecord>('listTagProducts', { tagId }, 'products');
    return products.filter((row) => productIds.includes(numberOf(row.productId))).map((row) => ({ productId: numberOf(row.productId) }));
  },

  async bindProducts(tagId: number, productIds: number[]) {
    await callRpc('product', 'bindTagProducts', { tagId, productIds });
  },

  async unbindProducts(tagId: number, productIds: number[]) {
    await callRpc('product', 'unbindTagProducts', { tagId, productIds });
  },

  async deleteTagProductRelations(tagId: number) {
    const products = await all<RpcRecord>('listTagProducts', { tagId }, 'products');
    if (products.length > 0) await callRpc('product', 'unbindTagProducts', { tagId, productIds: products.map((row) => numberOf(row.productId)) });
  },

  async getExistingProductIds(productIds: number[]) {
    const products = await listAllProducts();
    return products.filter((row) => productIds.includes(numberOf(row.id))).map((row) => numberOf(row.id));
  },
};

export const menuRpcRepository = {
  async getMenuList(pageNumber: number, pageSize: number) {
    const response = await page<RpcRecord>('listMenus', { page: pageNumber, pageSize, name: '' }, 'menus');
    return { items: response.items.map(menuView), total: response.total, page: response.page, pageSize: response.pageSize };
  },

  async getMenuById(id: number) {
    const menus = await all<RpcRecord>('listMenus', { name: '' }, 'menus');
    const menu = menus.find((item) => numberOf(item.id) === id);
    return menu ? menuView(menu) : null;
  },

  async createMenu(data: RpcRecord) {
    const menu = await callRpc<RpcRecord>('product', 'createMenu', data);
    return numberOf(menu.id);
  },

  async updateMenuById(id: number, data: RpcRecord) {
    await callRpc('product', 'updateMenu', { id, ...data });
  },

  async hasBoundStores(menuIds: number[]) {
    for (const menuId of menuIds) {
      const response = await page<RpcRecord>('listMenuStores', { menuId, page: 1, pageSize: 1 }, 'stores');
      if (response.total > 0) return true;
    }
    return false;
  },

  async deleteMenuWithRelations(menuIds: number[]) {
    for (const id of menuIds) await callRpc('product', 'deleteMenu', { id });
  },

  async getMenuGroupList(menuId: number) {
    const response = await page<RpcRecord>('listMenuGroups', { menuId, page: 1, pageSize: 100 }, 'groups');
    return Promise.all(response.items.map(async (group) => {
      const products = await page<RpcRecord>('listMenuProducts', { groupId: group.id, page: 1, pageSize: 1 }, 'menuProducts');
      return { ...groupView(group), productCount: products.total };
    }));
  },

  async getMenuGroupById(id: number) {
    const menus = await all<RpcRecord>('listMenus', { name: '' }, 'menus');
    for (const menu of menus) {
      const groups = await page<RpcRecord>('listMenuGroups', { menuId: menu.id, page: 1, pageSize: 100 }, 'groups');
      const group = groups.items.find((item) => numberOf(item.id) === id);
      if (group) return groupView(group);
    }
    return null;
  },

  async createMenuGroup(data: RpcRecord) {
    const group = await callRpc<RpcRecord>('product', 'createMenuGroup', { menuId: data.menuId, name: data.name, sort: data.sortOrder });
    return numberOf(group.id);
  },

  async updateMenuGroupById(id: number, data: RpcRecord) {
    await callRpc('product', 'updateMenuGroup', { id, name: data.name, sort: data.sortOrder });
  },

  async batchDeleteMenuGroups(groupIds: number[]) {
    for (const id of groupIds) await callRpc('product', 'deleteMenuGroup', { id });
  },

  async getMenuProductList(groupId: number) {
    const response = await page<RpcRecord>('listMenuProducts', { groupId, page: 1, pageSize: 100 }, 'menuProducts');
    return Promise.all(response.items.map(async (row) => {
      const product = await findProduct(numberOf(row.productId));
      return {
        groupId: numberOf(row.groupId),
        productId: numberOf(row.productId),
        productName: product?.name ?? '',
        price: product?.price ?? 0,
        status: product?.status ?? 0,
        sortOrder: numberOf(row.sort),
        createdAt: textOf(row.createdAt),
        updatedAt: textOf(row.updatedAt),
      };
    }));
  },

  async getMenuProduct(groupId: number, productId: number) {
    const rows = await all<RpcRecord>('listMenuProducts', { groupId }, 'menuProducts');
    return rows.find((row) => numberOf(row.productId) === productId) ?? null;
  },

  async addMenuProduct(data: RpcRecord) {
    await callRpc('product', 'createMenuProduct', { groupId: data.groupId, productId: data.productId, sort: data.sortOrder });
  },

  async batchRemoveMenuProducts(groupId: number, productIds: number[]) {
    for (const productId of productIds) await callRpc('product', 'deleteMenuProduct', { groupId, productId });
  },

  async updateMenuProductSort(groupId: number, productId: number, sortOrder: number) {
    await callRpc('product', 'updateMenuProduct', { groupId, productId, sort: sortOrder });
  },

  // Product RPC 当前只返回门店基础地域/状态，admin 契约还要求门店详情字段；该查询暂留本地。
  async getMenuStoreList(menuId: number, pageNumber: number, pageSize: number) {
    return localMenuRepository.getMenuStoreList(menuId, pageNumber, pageSize);
  },

  // 菜单分发需要 admin 当前的门店字段与返回统计，product RPC 暂未提供等价查询，暂留本地。
  async countStoresByArea(area: { province: string; city: string; district: string }) {
    return localMenuRepository.countStoresByArea(area);
  },

  async getUnboundStoreIdsByArea(menuId: number, area: { province: string; city: string; district: string }) {
    return localMenuRepository.getUnboundStoreIdsByArea(menuId, area);
  },

  async getStoreIdsByIds(storeIds: number[]) {
    return localMenuRepository.getStoreIdsByIds(storeIds);
  },

  async getBoundStoreIds(menuId: number, storeIds: number[]) {
    return localMenuRepository.getBoundStoreIds(menuId, storeIds);
  },

  async insertStoreMenuRelations(values: Array<{ storeId: number; menuId: number }>) {
    return localMenuRepository.insertStoreMenuRelations(values);
  },
};

function menuView(row: RpcRecord) {
  return { id: numberOf(row.id), name: textOf(row.name), description: textOf(row.description), createdAt: textOf(row.createdAt), updatedAt: textOf(row.updatedAt) };
}

function groupView(row: RpcRecord) {
  return { id: numberOf(row.id), menuId: numberOf(row.menuId), name: textOf(row.name), sortOrder: numberOf(row.sort), createdAt: textOf(row.createdAt), updatedAt: textOf(row.updatedAt) };
}
