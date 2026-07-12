// 共享的 axios 客户端工厂
export { createModuleClient } from "./client"

// 跨模块共享类型
export type {
  ModuleKey,
  ApiResponse,
  PaginatedData,
  PaginatedResponse,
} from "./client"


export * from "./auth"
export * from "./store"
export * from "./employee"
export * from "./product"
export * from "./tag"
export * from "./area"
export * from "./config"
export * from "./customization"
export * from "./ingredient"
export * from "./dashboard"
export * from "./menu"
export * from "./init"
export * from "./health"
