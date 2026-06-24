// ──────────────────────────────────────────────
// dextea-admin shared types
//
// 分层结构:
//   status/  — 状态定义（类型 + 常量 + 标签，自包含）
//   types/   — JSON 结构定义（接口，从 status/ 导入状态类型）
//
// 导入方式:
//   import { USER_STATUS, User, type UserStatus } from '@dextea/shared-types'
// ──────────────────────────────────────────────

// ---- status layer ----
export { USER_STATUS, USER_STATUS_LABEL, getUserStatusLabel } from './status/index.js';
export type { UserStatus } from './status/index.js';

export { STORE_STATUS, STORE_STATUS_LABEL, STORE_STATUS_VALUES, getStoreStatusLabel } from './status/index.js';
export type { StoreStatus } from './status/index.js';

export { PRODUCT_STATUS, PRODUCT_STATUS_LABEL } from './status/index.js';
export type { ProductStatus } from './status/index.js';

export { ORDER_STATUS, ORDER_STATUS_LABEL } from './status/index.js';
export type { OrderStatus } from './status/index.js';

// ---- types layer ----
export type {
  ApiResponse,
  PaginatedData,
  PaginatedResponse,
} from './types/index.js';

export type {
  HealthResponse,
} from './types/index.js';

export type {
  InitStatusData,
  InitRequest,
} from './types/index.js';

export type {
  LoginRequest,
  LoginResponse,
} from './types/index.js';

export type {
  User,
  CreateUserInput,
  UpdateUserInput,
  CreateUserResponse,
  UpdateUserResponse,
  ToggleUserStatusResponse,
  UserQuery,
} from './types/index.js';

export type {
  Store,
  CreateStoreInput,
  UpdateStoreInput,
  CreateStoreResponse,
  UpdateStoreResponse,
  UpdateStoreStatusRequest,
  UpdateStoreStatusResponse,
  UpdateStoreBasicInfoRequest,
  UpdateStoreBasicInfoResponse,
  UpdateStoreLocationRequest,
  UpdateStoreLocationResponse,
  StoreQuery,
} from './types/index.js';

export type {
  Division,
  ResolveAreaRequest,
} from './types/index.js';

export type {
  AmapConfig,
} from './types/index.js';

export type {
  Product,
  ProductCategory,
} from './types/index.js';

export type {
  Order,
  OrderItem,
} from './types/index.js';
