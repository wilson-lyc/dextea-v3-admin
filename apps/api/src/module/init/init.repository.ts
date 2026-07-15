import { eq } from 'drizzle-orm';
import { db } from '@/plugins/db/mysql/index.js';
import {
  configTable,
  employeesTable,
  rolesTable,
  permissionsTable,
  rolePermissionsTable,
  employeeRolesTable,
} from '@/plugins/db/mysql/schema.js';
import { PRESET_PERMISSIONS, PRESET_ROLES } from './init.presets.js';

export const initRepository = {
  async getInitStatus() {
    const rows = await db
      .select()
      .from(configTable)
      .where(eq(configTable.key, 'Initialized'))
      .limit(1);
    return rows[0] ?? null;
  },

  async getEmployeeByEmail(email: string) {
    const rows = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.email, email))
      .limit(1);
    return rows[0] ?? null;
  },

  async createAdmin(data: { email: string; password: string; displayName: string; status: number }) {
    const result = await db.insert(employeesTable).values(data);
    return Number(result[0]?.insertId ?? 0);
  },

  async writeInitFlag() {
    await db.insert(configTable).values({
      key: 'Initialized',
      value: 'true',
    });
  },

  /**
   * 写入预设权限数据（幂等：已存在的 key 跳过）。
   * @returns 权限 key -> id 的映射，供角色绑定使用
   */
  async ensurePresetPermissions(): Promise<Map<string, number>> {
    const keyToId = new Map<string, number>();

    for (const p of PRESET_PERMISSIONS) {
      const existing = await db
        .select({ id: permissionsTable.id })
        .from(permissionsTable)
        .where(eq(permissionsTable.key, p.key))
        .limit(1);

      if (existing.length > 0) {
        keyToId.set(p.key, existing[0]!.id);
        continue;
      }

      const result = await db
        .insert(permissionsTable)
        .values({ key: p.key, name: p.name, note: p.note });
      keyToId.set(p.key, Number(result[0]?.insertId ?? 0));
    }

    return keyToId;
  },

  /**
   * 写入预设角色数据并绑定其权限（幂等：角色/绑定已存在则跳过）。
   * @returns 角色名 -> id 的映射，供超级管理员绑定使用
   */
  async ensurePresetRoles(permKeyToId: Map<string, number>): Promise<Map<string, number>> {
    const nameToId = new Map<string, number>();

    for (const r of PRESET_ROLES) {
      const existing = await db
        .select({ id: rolesTable.id })
        .from(rolesTable)
        .where(eq(rolesTable.name, r.name))
        .limit(1);

      let roleId: number;
      if (existing.length > 0) {
        roleId = existing[0]!.id;
      } else {
        const result = await db
          .insert(rolesTable)
          .values({ name: r.name, note: r.note, status: r.status });
        roleId = Number(result[0]?.insertId ?? 0);
      }
      nameToId.set(r.name, roleId);

      const permissionIds = r.permissions
        .map((k) => permKeyToId.get(k))
        .filter((id): id is number => id !== undefined);
      if (permissionIds.length === 0) continue;

      const bound = await db
        .select({ permissionId: rolePermissionsTable.permissionId })
        .from(rolePermissionsTable)
        .where(eq(rolePermissionsTable.roleId, roleId));
      const existingIds = new Set(bound.map((b) => b.permissionId));
      const toAdd = permissionIds.filter((id) => !existingIds.has(id));

      if (toAdd.length > 0) {
        await db
          .insert(rolePermissionsTable)
          .values(toAdd.map((permissionId) => ({ roleId, permissionId })));
      }
    }

    return nameToId;
  },

  /** 将员工绑定到指定角色（幂等：已绑定则跳过） */
  async bindEmployeeRole(employeeId: number, roleId: number) {
    const bound = await db
      .select({ roleId: employeeRolesTable.roleId })
      .from(employeeRolesTable)
      .where(eq(employeeRolesTable.employeeId, employeeId))
      .limit(1);

    if (bound.some((b) => b.roleId === roleId)) return;

    await db.insert(employeeRolesTable).values({ employeeId, roleId });
  },
};
