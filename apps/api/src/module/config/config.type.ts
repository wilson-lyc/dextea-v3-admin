import { z } from 'zod/v4';

// 实体：高德地图配置

export const AmapConfigSchema = z.object({
  key: z.string(),
  securityCode: z.string(),
});
export type AmapConfig = z.infer<typeof AmapConfigSchema>;

// 获取高德地图密钥

export const AmapConfigResponseSchema = AmapConfigSchema;
export type AmapConfigResponse = AmapConfig;
