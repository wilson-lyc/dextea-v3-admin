import type { BizErrorCode } from '@/common/types';

export const InitErrorCodes = {
  ALREADY_INITIALIZED: { code: 10500, message: '系统已初始化，请勿重复操作' },
  INIT_FAILED: { code: 10501, message: '初始化失败，请检查数据库连接或稍后重试' },
  MISSING_FIELDS: { code: 10502, message: '请填写所有必填字段' },
  EMAIL_EXISTS: { code: 10503, message: '该邮箱已被使用' },
} as const satisfies Record<string, BizErrorCode>;
