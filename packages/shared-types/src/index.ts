// ---- status layer ----
export { USER_STATUS, USER_STATUS_VALUES } from './status/index.js';
export type { UserStatus } from './status/index.js';

export { STORE_STATUS, STORE_STATUS_VALUES } from './status/index.js';
export type { StoreStatus } from './status/index.js';

export { PRODUCT_STATUS, PRODUCT_STATUS_VALUES } from './status/index.js';
export type { ProductStatus } from './status/index.js';

export { PRODUCT_CUSTOMIZATION_STATUS, PRODUCT_CUSTOMIZATION_STATUS_VALUES } from './status/index.js';
export type { ProductCustomizationStatus } from './status/index.js';

export { CUSTOMIZATION_OPTION_STATUS, CUSTOMIZATION_OPTION_STATUS_VALUES } from './status/index.js';
export type { CustomizationOptionStatus } from './status/index.js';


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
  AuthMeResponse,
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
  ResetStorePasswordResponse,
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
  CreateProductInput,
  CreateProductResponse,
  ProductQuery,
} from './types/index.js';

export type {
  ProductTag,
  CreateTagInput,
  UpdateTagInput,
  TagQuery,
} from './types/index.js';

export type {
  Order,
  OrderItem,
} from './types/index.js';

export type {
  DashboardStats,
} from './types/index.js';

export type {
  ProductCustomization,
  CreateProductCustomizationInput,
  ProductCustomizationQuery,
} from './types/index.js';

export type {
  CustomizationOption,
  CreateCustomizationOptionInput,
  UpdateCustomizationOptionInput,
} from './types/index.js';
