// ──────────────────────────────────────────────
// Unified shared types for dextea-admin
// Re-exported from per-domain modules for easy maintenance.
// Import via `@dextea/shared-types` in both API and web.
// ──────────────────────────────────────────────

export type {
  ApiResponse,
  PaginatedData,
  PaginatedResponse,
} from './api-response.js';

export type {
  HealthResponse,
} from './health.js';

export type {
  InitStatusData,
  InitRequest,
} from './init.js';

export type {
  LoginRequest,
  LoginResponse,
} from './auth.js';

export type {
  UserStatus,
  User,
  CreateUserInput,
  UpdateUserInput,
  CreateUserResponse,
  UpdateUserResponse,
  ToggleUserStatusResponse,
  UserQuery,
} from './user.js';

export type {
  StoreStatus,
  Store,
  CreateStoreInput,
  UpdateStoreInput,
  CreateStoreResponse,
  UpdateStoreResponse,
  UpdateStoreStatusRequest,
  UpdateStoreStatusResponse,
  StoreQuery,
} from './store.js';

export type {
  Division,
  ResolveAreaRequest,
} from './area.js';

export type {
  AmapConfig,
} from './config.js';

export type {
  Product,
  ProductCategory,
  ProductStatus,
} from './product.js';

export type {
  Order,
  OrderItem,
  OrderStatus,
} from './order.js';
