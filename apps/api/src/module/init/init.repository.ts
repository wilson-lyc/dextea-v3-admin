import { eq } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import { BizError } from '@/common/exceptions/index.js';
import { InitErrorCodes } from './init.errorcode.js';
import {
  config,
  employees,
  roles,
  permissions,
  rolePermissions,
  employeeRoles,
} from '@/plugins/db/mysql/schema.js';
import { PRESET_PERMISSIONS, PRESET_ROLES } from './init.presets.js';

/** drizzle 事务对象类型（与 db 拥有相同的查询能力） */
type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** 是否为 MySQL 唯一键冲突（ER_DUP_ENTRY） */
function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'ER_DUP_ENTRY'
  );
}

export const initRepository = {
  async getInitStatus() {
    const rows = await db
      .select()
      .from(config)
      .where(eq(config.key, 'Initialized'))
      .limit(1);
    return rows[0] ?? null;
  },

  async getEmployeeByEmail(tx: DbTx, email: string) {
    const rows = await tx
      .select()
      .from(employees)
      .where(eq(employees.email, email))
      .limit(1);
    return rows[0] ?? null;
  },

  /**
   * 抢占「已初始化」标记（幂等闸门）。
   * config.key 具备唯一约束：并发请求或失败重试时若标记已存在会触发唯一键冲突，
   * 此时转为 ALREADY_INITIALIZED，严格保证「已初始化过不允许再初始化」。
   */
  async claimInitFlag(tx: DbTx) {
    try {
      await tx.insert(config).values({
        key: 'Initialized',
        value: 'true',
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new BizError(InitErrorCodes.ALREADY_INITIALIZED);
      }
      throw err;
    }
  },

  async createAdmin(
    tx: DbTx,
    data: { email: string; password: string; displayName: string; status: number },
  ) {
    const result = await tx.insert(employees).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  /**
   * 写入预设权限数据（幂等：已存在的 key 跳过，不覆盖）。
   * @returns 权限 key -> id 的映射，供角色绑定使用
   */
  async ensurePresetPermissions(tx: DbTx): Promise<Map<string, number>> {
    const keyToId = new Map<string, number>();

    for (const p of PRESET_PERMISSIONS) {
      const existing = await tx
        .select({ id: permissions.id })
        .from(permissions)
        .where(eq(permissions.key, p.key))
        .limit(1);

      if (existing.length > 0) {
        keyToId.set(p.key, existing[0]!.id);
        continue;
      }

      const result = await tx
        .insert(permissions)
        .values({ key: p.key, name: p.name, note: p.note });
      keyToId.set(p.key, Number(result[0]?.insertId ?? 0));
    }

    return keyToId;
  },

  /**
   * 写入预设角色数据并绑定其权限（幂等：角色/绑定已存在则跳过，不覆盖）。
   * @returns 角色名 -> id 的映射，供超级管理员绑定使用
   */
  async ensurePresetRoles(tx: DbTx, permKeyToId: Map<string, number>): Promise<Map<string, number>> {
    const nameToId = new Map<string, number>();

    for (const r of PRESET_ROLES) {
      const existing = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, r.name))
        .limit(1);

      let roleId: number;
      if (existing.length > 0) {
        roleId = existing[0]!.id;
      } else {
        const result = await tx
          .insert(roles)
          .values({ name: r.name, note: r.note, status: r.status });
        roleId = Number(result[0]?.insertId ?? 0);
      }
      nameToId.set(r.name, roleId);

      const permissionIds = r.permissions
        .map((k) => permKeyToId.get(k))
        .filter((id): id is number => id !== undefined);
      if (permissionIds.length === 0) continue;

      const bound = await tx
        .select({ permissionId: rolePermissions.permissionId })
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));
      const existingIds = new Set(bound.map((b) => b.permissionId));
      const toAdd = permissionIds.filter((id) => !existingIds.has(id));

      if (toAdd.length > 0) {
        await tx
          .insert(rolePermissions)
          .values(toAdd.map((permissionId) => ({ roleId, permissionId })));
      }
    }

    return nameToId;
  },

  /** 将员工绑定到指定角色（幂等：已绑定则跳过，不覆盖） */
  async bindEmployeeRole(tx: DbTx, employeeId: number, roleId: number) {
    const bound = await tx
      .select({ roleId: employeeRoles.roleId })
      .from(employeeRoles)
      .where(eq(employeeRoles.employeeId, employeeId))
      .limit(1);

    if (bound.some((b) => b.roleId === roleId)) return;

    await tx.insert(employeeRoles).values({ employeeId, roleId });
  },
};
