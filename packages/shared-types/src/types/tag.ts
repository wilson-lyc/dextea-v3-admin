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
