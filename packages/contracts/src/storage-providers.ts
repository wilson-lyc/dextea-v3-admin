import { z } from 'zod/v4';

/**
 * 存储厂商注册表（单一事实来源）。
 *
 * 设计修正：存储位置模块的 `provider` 字段原先为任意字符串，存在可被写入任意厂商的缺陷。
 * 此处将厂商收敛为「已注册白名单」，并对每家厂商各自携带适配参数
 * （endpoint 模板、路径风格、表单占位提示等），实现「限制厂商 + 对每家厂商做适配」。
 *
 * 当前严格仅适配腾讯云 COS 一家；新增厂商时在此注册即可，无需改动业务逻辑，
 * 适配器工厂会依据 `protocol` 自动分派实现。
 */
export interface StorageProviderDef {
  /** provider 字段值，与数据库 storage_locations.provider 对应 */
  value: string;
  /** 中文展示名 */
  label: string;
  /** 接入协议：当前统一基于 S3 兼容协议 */
  protocol: 's3';
  /** endpoint 模板，{region} 会被替换为实际 region；为空则需用户手动填写 */
  endpointTemplate: string;
  /** 是否强制路径风格（virtual-hosted 与 path-style 区别） */
  forcePathStyle: boolean;
  /** 表单字段提示 */
  regionLabel: string;
  regionPlaceholder: string;
  endpointPlaceholder: string;
  publicBaseUrlPlaceholder: string;
  /** 备注说明 */
  description?: string;
}

export const STORAGE_PROVIDERS: StorageProviderDef[] = [
  {
    value: 'tencent',
    label: '腾讯云 COS',
    protocol: 's3',
    endpointTemplate: 'https://cos.{region}.myqcloud.com',
    forcePathStyle: false,
    regionLabel: '地域',
    regionPlaceholder: 'ap-guangzhou',
    endpointPlaceholder: 'https://my-bucket.cos.ap-guangzhou.myqcloud.com',
    publicBaseUrlPlaceholder: 'https://my-bucket.cos.ap-guangzhou.myqcloud.com',
    description: '腾讯云对象存储（COS），S3 兼容协议：使用 AWS S3 SDK 通过 COS endpoint 接入',
  },
];

/** provider 合法取值元组，供 zod enum 使用 */
export const STORAGE_PROVIDER_VALUES = STORAGE_PROVIDERS.map((p) => p.value) as [
  string,
  ...string[],
];

/** value -> StorageProviderDef 查表 */
export const STORAGE_PROVIDER_MAP: Record<string, StorageProviderDef> =
  Object.fromEntries(STORAGE_PROVIDERS.map((p) => [p.value, p]));

/** 按 provider 取值，未注册返回 undefined */
export function getStorageProvider(value: string): StorageProviderDef | undefined {
  return STORAGE_PROVIDER_MAP[value];
}

/** provider 字段校验：限制为已注册厂商 */
export const StorageProviderEnumSchema = z.enum(STORAGE_PROVIDER_VALUES);
export type StorageProviderValue = z.infer<typeof StorageProviderEnumSchema>;
