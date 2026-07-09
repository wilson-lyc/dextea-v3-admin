import { BizErrorCode } from '@/common/types/index.js';
import { ApiResponse } from '@/common/types/index.js';

export class BizError extends Error {
  public readonly code: number;
  public readonly httpStatus: number;

  constructor(bizErrorCode: BizErrorCode, detail?: string, httpStatus = 400) {
    super(detail ?? bizErrorCode.message);
    this.name = 'BizError';
    this.code = bizErrorCode.code;
    this.httpStatus = httpStatus;
  }

  toResponse() {
    return ApiResponse.error(this.code, this.message);
  }
}
