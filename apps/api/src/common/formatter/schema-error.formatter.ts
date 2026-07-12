/**
 * Zod 参数校验失败时的错误信息格式化器
 * 把 ajv/Zod 抛出的机器可读错误（如 required / type / enum）翻译成中文友好提示，
 * 供全局错误处理器统一以 400 返回。
 */
interface SchemaValidationError {
  keyword: string;
  instancePath: string;
  params: { missingProperty?: string };
  message?: string;
}

export function schemaErrorFormatter(
  errors: readonly SchemaValidationError[] | undefined,
): Error {
  const err = errors?.[0];
  if (!err) return new Error('请求参数校验失败');

  let message: string;
  switch (err.keyword) {
    case 'required': {
      const field = err.params.missingProperty ?? '';
      message = `缺少必填字段「${field}」`;
      break;
    }
    case 'type': {
      const field = err.instancePath.replace(/^\//, '');
      message = field ? `「${field}」格式不正确` : '请求参数格式不正确';
      break;
    }
    case 'minLength': {
      const field = err.instancePath.replace(/^\//, '');
      message = `「${field}」不能为空`;
      break;
    }
    case 'minimum':
    case 'maximum': {
      const field = err.instancePath.replace(/^\//, '');
      message = `「${field}」超出范围`;
      break;
    }
    case 'enum': {
      const field = err.instancePath.replace(/^\//, '');
      message = `「${field}」的值无效`;
      break;
    }
    default:
      message = err.message ?? '请求参数校验失败';
  }

  return new Error(message);
}
