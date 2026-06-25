// ====== 健康检查 ======
// ──────────────────────────────

import type { ApiResponse } from './api-response.js';

export interface HealthData {
  status: string;
  timestamp: string;
}

export type HealthResponse = ApiResponse<HealthData>;
