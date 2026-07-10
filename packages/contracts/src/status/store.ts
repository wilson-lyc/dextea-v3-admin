/**
 * 门店状态
 * 0=休息中  1=营业中  2=筹备中  3=已注销
 *
 * 状态项统一包含三个字段：
 * - key:   稳定的字符串键（用于序列化/枚举标识）
 * - label: 中文语义（用于界面展示，禁止直接展示数字）
 * - value: 数字值（数据库存储 / 接口传输）
 */
export const STORE_STATUS = {
  RESTING: { key: 'resting', label: '休息中', value: 0 },
  OPEN: { key: 'open', label: '营业中', value: 1 },
  PREPARING: { key: 'preparing', label: '筹备中', value: 2 },
  CLOSED: { key: 'closed', label: '已注销', value: 3 },
} as const;

/** 单个状态项类型 */
export type StoreStatusItem = (typeof STORE_STATUS)[keyof typeof STORE_STATUS];

/** 状态数字值联合类型 */
export type StoreStatus = StoreStatusItem['value'];

/** 所有状态值 */
export const STORE_STATUS_VALUES: readonly StoreStatus[] = Object.values(STORE_STATUS).map(
  (s) => s.value,
);

/** value -> 中文 label 映射 */
export const STORE_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(STORE_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;
