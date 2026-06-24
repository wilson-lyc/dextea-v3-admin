// ====== JSON 结构定义 barrel ======
// ──────────────────────────────

export type { ApiResponse, PaginatedData, PaginatedResponse } from './api-response.js';
export type { HealthResponse } from './health.js';
export type { InitStatusData, InitRequest } from './init.js';
export type { LoginRequest, LoginResponse } from './auth.js';
export type { User, CreateUserInput, UpdateUserInput, CreateUserResponse, UpdateUserResponse, ToggleUserStatusResponse, UserQuery } from './user.js';
export type { Store, CreateStoreInput, UpdateStoreInput, CreateStoreResponse, UpdateStoreResponse, UpdateStoreStatusRequest, UpdateStoreStatusResponse, UpdateStoreBasicInfoRequest, UpdateStoreBasicInfoResponse, StoreQuery } from './store.js';
export type { Division, ResolveAreaRequest } from './area.js';
export type { AmapConfig } from './config.js';
export type { Product, ProductCategory } from './product.js';
export type { Order, OrderItem } from './order.js';
