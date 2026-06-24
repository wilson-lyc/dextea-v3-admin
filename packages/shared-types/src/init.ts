// ====== 管理员初始化 ======

export interface InitStatusData {
  initialized: boolean;
}

export interface InitRequest {
  email: string;
  password: string;
  displayName: string;
}
