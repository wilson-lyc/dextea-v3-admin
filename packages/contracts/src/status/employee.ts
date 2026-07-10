/**
 * 员工状态
 * 0=禁用  1=激活
 *
 * 状态项统一包含三个字段：
 * - key:   稳定的字符串键（用于序列化/枚举标识）
 * - label: 中文语义（用于界面展示，禁止直接展示数字）
 * - value: 数字值（数据库存储 / 接口传输）
 */
export const EMPLOYEE_STATUS = {
  DISABLED: { key: 'disabled', label: '禁用', value: 0 },
  ACTIVE: { key: 'active', label: '激活', value: 1 },
} as const;

/** 单个状态项类型 */
export type EmployeeStatusItem = (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];

/** 状态数字值联合类型 */
export type EmployeeStatus = EmployeeStatusItem['value'];

/** 所有状态值 */
export const EMPLOYEE_STATUS_VALUES: readonly EmployeeStatus[] = Object.values(EMPLOYEE_STATUS).map(
  (s) => s.value,
);

/** value -> 中文 label 映射 */
export const EMPLOYEE_STATUS_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(EMPLOYEE_STATUS).map((s) => [s.value, s.label]),
) as Record<number, string>;
