export interface Menu {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuGroup {
  id: number;
  menuId: number;
  name: string;
  sortOrder: number;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuProduct {
  groupId: number;
  productId: number;
  productName?: string;
  price?: number;
  status?: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuInput {
  name: string;
  description?: string;
}

export interface UpdateMenuInput {
  name?: string;
  description?: string;
}

export interface CreateMenuGroupInput {
  menuId: number;
  name: string;
  sortOrder?: number;
}

export interface UpdateMenuGroupInput {
  name?: string;
  sortOrder?: number;
}

export interface AddMenuProductInput {
  productId: number;
  sortOrder?: number;
}

export interface UpdateMenuProductSortInput {
  productId: number;
  sortOrder: number;
}

export interface BatchUnbindMenuProductsInput {
  productIds: number[];
}

export interface BatchDeleteMenuGroupsInput {
  groupIds: number[];
}

export interface CreateMenuResponse {
  id: number;
}

export interface UpdateMenuResponse {
  id: number;
}

export interface CreateMenuGroupResponse {
  id: number;
}

export interface MenuQuery {
  page?: string;
  pageSize?: string;
}
