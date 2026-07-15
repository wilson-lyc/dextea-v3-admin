import type { BizErrorCode } from '@/common/types';

/**
 * 图库模块错误码 (11000-11099)
 */
export const GalleryErrorCodes = {
  NOT_FOUND: { code: 11001, message: '图片不存在' },
  UPLOAD_FAILED: { code: 11002, message: '图片上传失败，请稍后重试' },
  DELETE_FAILED: { code: 11003, message: '图片删除失败，请稍后重试' },
  INVALID_FILE: { code: 11004, message: '仅支持上传图片文件' },
  LIST_FAILED: { code: 11005, message: '获取图片列表失败' },
  STORAGE_LOCATION_NOT_FOUND: { code: 11006, message: '指定的存储位置不存在' },
  STORAGE_LOCATION_DISABLED: { code: 11007, message: '指定的存储位置已禁用' },
} as const satisfies Record<string, BizErrorCode>;
