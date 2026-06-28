// ====== 商品标签 ======
// ──────────────────────────────

/** 商品标签 */
export interface ProductTag {
  id: number;
  name: string;
  boundCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** 新增标签 */
export interface CreateTagInput {
  name: string;
}

/** 更新标签 */
export interface UpdateTagInput {
  name: string;
}

export type TagQuery = {
  page?: string;
  pageSize?: string;
};

/** 批量绑定商品到标签（POST /tags/:id/products body） */
export interface BindProductToTagInput {
  productIds: number[];
}

/** 批量绑定标签到商品（POST /products/:id/tags body） */
export interface BindTagToProductInput {
  tagIds: number[];
}

/** 批量解绑商品与标签（DELETE /tags/:id/products body） */
export interface UnbindProductFromTagInput {
  productIds: number[];
}

/** 批量解绑标签与商品（DELETE /products/:id/tags body） */
export interface UnbindTagFromProductInput {
  tagIds: number[];
}
