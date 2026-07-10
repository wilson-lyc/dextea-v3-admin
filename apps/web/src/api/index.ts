import axios, { type AxiosInstance } from "axios"
import { toast } from "sonner"
import { redirectToLogin, redirectToForbidden } from "./navigation"

// ──────────────────────────────────────────────
// 模块标识：与后端路由模块严格对齐
// ──────────────────────────────────────────────
export type ModuleKey =
  | "auth"
  | "store"
  | "employee"
  | "product"
  | "tag"
  | "area"
  | "config"
  | "product-customization"
  | "ingredient"
  | "dashboard"
  | "store-status"
  | "menu"
  | "init"
  | "health"

// 各模块独立的环境变量键（集中在 .env 管理）
const MODULE_ENV_KEYS: Record<ModuleKey, keyof ImportMetaEnv> = {
  auth: "VITE_API_AUTH_BASE_URL",
  store: "VITE_API_STORE_BASE_URL",
  employee: "VITE_API_EMPLOYEE_BASE_URL",
  product: "VITE_API_PRODUCT_BASE_URL",
  tag: "VITE_API_TAG_BASE_URL",
  area: "VITE_API_AREA_BASE_URL",
  config: "VITE_API_CONFIG_BASE_URL",
  "product-customization": "VITE_API_PRODUCT_CUSTOMIZATION_BASE_URL",
  ingredient: "VITE_API_INGREDIENT_BASE_URL",
  dashboard: "VITE_API_DASHBOARD_BASE_URL",
  "store-status": "VITE_API_STORE_STATUS_BASE_URL",
  menu: "VITE_API_MENU_BASE_URL",
  init: "VITE_API_INIT_BASE_URL",
  health: "VITE_API_HEALTH_BASE_URL",
}

// 无 /api/v2 前缀的模块使用独立默认地址
const DEFAULT_BASE_URLS: Partial<Record<ModuleKey, string>> = {
  health: "http://localhost:3001",
}
const FALLBACK_BASE_URL = "http://localhost:3001/api/v2"

const clientCache = new Map<ModuleKey, AxiosInstance>()

/**
 * 按模块创建独立的 axios 实例（按 moduleKey 缓存复用）。
 * 各模块 Base URL 取自 .env 中对应的 VITE_API_<MODULE>_BASE_URL，缺失时回退默认。
 */
export function createModuleClient(moduleKey: ModuleKey): AxiosInstance {
  const cached = clientCache.get(moduleKey)
  if (cached) return cached

  const baseURL =
    import.meta.env[MODULE_ENV_KEYS[moduleKey]] ??
    DEFAULT_BASE_URLS[moduleKey] ??
    FALLBACK_BASE_URL

  const instance = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
  })

  // Request interceptor — auto-attach auth token
  instance.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => {
      // 后端在 HTTP 200 上返回业务错误，我们用 reject 让页面 catch 块统一处理
      if (
        response.data &&
        typeof response.data.code === "number" &&
        response.data.code !== 0
      ) {
        return Promise.reject(new Error(response.data.message))
      }
      return response
    },

    (error) => {
      if (error.response) {
        const status = error.response.status
        if (status === 401 || (status === 403 && error.response.data?.code === 10103)) {
          toast.error("登录失效，请重新登录")
          redirectToLogin()
          return Promise.reject(error)
        }
        if (status === 403) {
          redirectToForbidden()
          return Promise.reject(error)
        }
      }

      // 兜底：系统错误或网络异常，不暴露原始错误信息给用户
      toast.error("系统繁忙，请稍后重试")
      return Promise.reject({ code: -1, message: "系统繁忙，请稍后重试", data: null })
    },
  )

  clientCache.set(moduleKey, instance)
  return instance
}

// ──────────────────────────────────────────────
// 通用响应信封类型
// ──────────────────────────────────────────────
export type ApiResponse<T = unknown> = {
  code: number
  data: T
  message: string
}

export type PaginatedData<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>

// ──────────────────────────────────────────────
// 业务模块
// ──────────────────────────────────────────────
export * from "./auth"
export * from "./store"
export * from "./employee"
export * from "./product"
export * from "./tag"
export * from "./area"
export * from "./config"
export * from "./product-customization"
export * from "./ingredient"
export * from "./dashboard"
export * from "./store-status"
export * from "./menu"
export * from "./init"
export * from "./health"
