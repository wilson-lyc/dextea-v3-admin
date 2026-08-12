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

// 各模块的路径前缀，版本号由前端 API 层自行决定（网关统一入口）
const MODULE_PREFIX: Record<ModuleKey, string> = {
  auth: "/api/v2",
  store: "/api/v2",
  employee: "/api/v2",
  product: "/api/v2",
  tag: "/api/v2",
  area: "/api/v2",
  config: "/api/v2",
  customization: "/api/v2",
  ingredient: "/api/v2",
  dashboard: "/api/v2",
  menu: "/api/v2",
  init: "/api/v2",
  role: "/api/v2",
  permission: "/api/v2",
  gallery: "/api/v2",
  customer: "/api/v2",
  health: "",
}

const FALLBACK_BASE_URL = "http://localhost:8196"

const clientCache = new Map<ModuleKey, AxiosInstance>()

/**
 * 按模块创建独立的 axios 实例（按 moduleKey 缓存复用）。
 * 网关地址统一取自 VITE_API_BASE_URL，模块路径前缀（含版本号）由此处定义。
 */
export function createModuleClient(moduleKey: ModuleKey): AxiosInstance {
  const cached = clientCache.get(moduleKey)
  if (cached) return cached

  const baseURL =
    `${import.meta.env.VITE_API_BASE_URL ?? FALLBACK_BASE_URL}${MODULE_PREFIX[moduleKey]}`

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
