import { z } from 'zod/v4';

/** 高德地图配置 */
export const AmapConfigSchema = z.object({
  key: z.string().describe('密钥'),
  securityCode: z.string().describe('安全密钥'),
});
export type AmapConfig = z.infer<typeof AmapConfigSchema>;

/** 获取高德地图密钥 */
export const AmapConfigResponseSchema = AmapConfigSchema;
export type AmapConfigResponse = AmapConfig;
