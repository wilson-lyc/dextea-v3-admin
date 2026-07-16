import { createModuleClient, type ApiResponse, type PaginatedData } from "./client"
import type {
  Customer,
  GetCustomerListRequest,
} from "@dextea-admin/contracts"

// ──── DTO 类型（统一来自 @dextea-admin/contracts） ────
export type {
  Customer,
  GetCustomerListRequest,
} from "@dextea-admin/contracts"

const http = createModuleClient("customer")

/**
 * 获取顾客列表（分页 + 多条件筛选）
 * GET /customers
 */
export function getCustomers(params?: Partial<GetCustomerListRequest>) {
  return http
    .get<ApiResponse<PaginatedData<Customer>>>("/customers", { params })
    .then((res) => res.data)
}
