import { z } from 'zod/v4';

/** 行政区划实体 */
export const DivisionSchema = z.object({
  code: z.string(),
  name: z.string(),
});
export type Division = z.infer<typeof DivisionSchema>;

/** 子级行政区划路径参数 */
export const AreaChildrenParamsSchema = z.object({
  code: z.string().min(1, '地区编码不能为空'),
});
export type AreaChildrenParams = z.infer<typeof AreaChildrenParamsSchema>;

/** 省份列表 / 子级地区列表响应 */
export const AreaListResponseSchema = z.array(DivisionSchema);
export type AreaListResponse = z.infer<typeof AreaListResponseSchema>;

/** 解析地区名称请求 */
export const ResolveAreaRequestSchema = z.object({
  names: z.array(z.string()).min(1, '地区名称列表不能为空'),
});
export type ResolveAreaRequest = z.infer<typeof ResolveAreaRequestSchema>;

/** 解析地区名称响应 */
export const ResolveAreaResponseSchema = z.array(DivisionSchema);
export type ResolveAreaResponse = z.infer<typeof ResolveAreaResponseSchema>;
