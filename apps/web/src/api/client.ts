import axios, { type AxiosInstance } from "axios"
import { toast } from "sonner"
import { redirectToLogin, redirectToForbidden } from "./navigation"
export type { ApiResponse, PaginatedData, PaginatedResponse } from "./shared.type"

// 模块标识
export type ModuleKey =
  | "auth"
  | "store"
  | "employee"
  | "product"
  | "tag"
  | "area"
  | "config"
  | "customization"
  | "ingredient"
  | "dashboard"
  | "menu"
  | "init"
  | "role"
  | "permission"
  | "gallery"
  | "health"
  | "customer"

// 各模块独立的环境变量键（集中在 .env 管理）
const MODULE_ENV_KEYS: Record<ModuleKey, keyof ImportMetaEnv> = {
  auth: "VITE_API_AUTH_BASE_URL",
  store: "VITE_API_STORE_BASE_URL",
  employee: "VITE_API_EMPLOYEE_BASE_URL",
  product: "VITE_API_PRODUCT_BASE_URL",
  tag: "VITE_API_TAG_BASE_URL",
  area: "VITE_API_AREA_BASE_URL",
  config: "VITE_API_CONFIG_BASE_URL",
  customization: "VITE_API_CUSTOMIZATION_BASE_URL",
  ingredient: "VITE_API_INGREDIENT_BASE_URL",
  dashboard: "VITE_API_DASHBOARD_BASE_URL",
  menu: "VITE_API_MENU_BASE_URL",
  init: "VITE_API_INIT_BASE_URL",
  role: "VITE_API_ROLE_BASE_URL",
  permission: "VITE_API_PERMISSION_BASE_URL",
  gallery: "VITE_API_GALLERY_BASE_URL",
  health: "VITE_API_HEALTH_BASE_URL",
  customer: "VITE_API_CUSTOMER_BASE_URL",
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
      // HTTP 200 但业务 code 不为 0：抛异常交由业务侧自行处理，不弹 toast
      if (
        response.data &&
        typeof response.data.code === "number" &&
        response.data.code !== 0
      ) {
        const err = new Error("请求失败")
        const e = err as Error & { businessCode?: number; businessMessage?: string }
        e.businessCode = response.data.code
        e.businessMessage = response.data.message
        return Promise.reject(e)
      }
      return response
    },

    (error) => {
      const status = error.response?.status

      // 401 或登录超时（403 + 特定业务码）：定制提示并跳登录
      if (
        status === 401 ||
        (status === 403 && error.response?.data?.code === 10103)
      ) {
        toast.error("登录已失效，请重新登录")
        redirectToLogin()
        return Promise.reject(error)
      }

      // 其他 403：无访问权限，定制提示并跳 403 页
      if (status === 403) {
        toast.error("无访问权限")
        redirectToForbidden()
        return Promise.reject(error)
      }

      // 其余 HTTP 非 200：固定兜底提示，不信任后端 message
      if (status) {
        ;(error as Error & { businessMessage?: string }).businessMessage =
          error.response?.data?.message
        toast.error("服务异常，请稍后重试")
        return Promise.reject(error)
      }

      // 无响应体（网络异常等）
      toast.error("网络异常，请稍后重试")
      return Promise.reject(error)
    },
  )

  clientCache.set(moduleKey, instance)
  return instance
}
