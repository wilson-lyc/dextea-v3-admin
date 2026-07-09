import { z } from 'zod/v4';

export interface APIResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export function ApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    code: z.number(),
    message: z.string(),
    data: dataSchema.nullable(),
  });
}

export const ApiResponse = {
  success<T>(data: T, message?: string) {
    return { code: 0, message: message ?? 'success', data };
  },
  error(code: number, message: string) {
    return { code, message, data: null };
  },
};
