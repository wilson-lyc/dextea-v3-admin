// ====== 用户 ======
// JSON 结构定义，状态类型从 status/ 导入
// ──────────────────────────────

import type { UserStatus } from '../status/user.js';

export interface User {
  id: number;
  email: string;
  displayName: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
}

export interface UpdateUserInput {
  email: string;
  displayName: string;
  status: UserStatus;
}

export interface CreateUserResponse {
  user: {
    id: number;
    email: string;
    displayName: string;
    status: 0;
  };
  initialPassword: string;
}

export interface UpdateUserResponse {
  id: number;
  email: string;
  displayName: string;
  status: number;
}

export interface ToggleUserStatusResponse {
  status: UserStatus;
}

/** Query string shape for GET /users */
export interface UserQuery {
  page?: string;
  pageSize?: string;
}
