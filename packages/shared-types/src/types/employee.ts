// ====== 员工 ======
// JSON 结构定义，状态类型从 status/ 导入
// ──────────────────────────────

import type { EmployeeStatus } from '../status/employee.js';

export interface Employee {
  id: number;
  email: string;
  displayName: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  email: string;
  displayName: string;
}

export interface UpdateEmployeeInput {
  email: string;
  displayName: string;
  status: EmployeeStatus;
}

export interface CreateEmployeeResponse {
  user: {
    id: number;
    email: string;
    displayName: string;
    status: EmployeeStatus;
  };
  initialPassword: string;
}

export interface UpdateEmployeeResponse {
  id: number;
  email: string;
  displayName: string;
  status: number;
}

export interface ToggleEmployeeStatusResponse {
  status: EmployeeStatus;
}

/** Query string shape for GET /employees */
export interface EmployeeQuery {
  page?: string;
  pageSize?: string;
  keyword?: string;
}
