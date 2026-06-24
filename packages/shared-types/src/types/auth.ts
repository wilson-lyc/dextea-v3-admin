// ====== 认证 ======
// ──────────────────────────────

export interface LoginRequest {
  account: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    displayName: string;
  };
}

export interface AuthMeResponse {
  user: {
    id: number;
    email: string;
    displayName: string;
  };
}
