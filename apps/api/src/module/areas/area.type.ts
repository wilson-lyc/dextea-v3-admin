import { z } from 'zod/v4';

// 实体：行政区划

export const DivisionSchema = z.object({
  code: z.string(),
  name: z.string(),
});
export type Division = z.infer<typeof DivisionSchema>;

// 省份列表 / 子级地区

export const AreaChildrenParamsSchema = z.object({
  code: z.string().min(1, '地区编码不能为空'),
});

export const AreaListResponseSchema = z.array(DivisionSchema);
export type AreaListResponse = Division[];

// 解析地区名称

export const ResolveAreaRequestSchema = z.object({
  names: z.array(z.string()).min(1, '地区名称列表不能为空'),
});
export type ResolveAreaRequest = z.infer<typeof ResolveAreaRequestSchema>;

export const ResolveAreaResponseSchema = z.array(DivisionSchema);
export type ResolveAreaResponse = Division[];
