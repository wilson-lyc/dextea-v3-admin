export { ApiResponseSchema } from '@dextea-admin/contracts';

export interface APIResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

export const ApiResponse = {
  success<T>(data: T, message?: string) {
    return { code: 0, message: message ?? 'success', data };
  },
  error(code: number, message: string) {
    return { code, message, data: null };
  },
};
