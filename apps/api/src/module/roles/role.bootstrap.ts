import { asc, eq } from 'drizzle-orm';
import type { FastifyBaseLogger } from 'fastify';
import { db } from '@/plugins/db/mysql/index.js';
import {
  employeesTable,
  employeeRolesTable,
  permissionsTable,
  rolePermissionsTable,
  rolesTable,
} from '@/plugins/db/mysql/schema.js';
import { ROLE_STATUS } from '@dextea-admin/contracts';

/** 超级权限键：满足任意资源的读写 */
const SUPER_PERMISSION_KEY = '*';
/** 超级管理员角色名 */
const SUPER_ROLE_NAME = '超级管理员';

/**
 * RBAC 引导：保证系统始终存在一个可用的「超级管理员」，避免开启接口鉴权后无人可管理。
 *
 * 该过程是幂等的，可在每次启动时安全执行：
 * 1. 确保存在超级权限 `*`
 * 2. 确保存在「超级管理员」角色并绑定超级权限
 * 3. 若初始管理员（id 最小的员工）当前没有任何角色，则为其绑定「超级管理员」
 *
 * 其余业务权限为静态数据，由工程师手动录入并通过角色绑定，本引导不干预。
 */
export async function ensureRbacBootstrap(logger?: FastifyBaseLogger): Promise<void> {
  try {
    // 1. 确保超级权限存在
    let permissionRows = await db
      .select({ id: permissionsTable.id })
      .from(permissionsTable)
      .where(eq(permissionsTable.key, SUPER_PERMISSION_KEY))
      .limit(1);

    if (permissionRows.length === 0) {
      await db.insert(permissionsTable).values({
        key: SUPER_PERMISSION_KEY,
        name: '超级权限',
        note: '拥有所有资源的读写权限',
      });
      permissionRows = await db
        .select({ id: permissionsTable.id })
        .from(permissionsTable)
        .where(eq(permissionsTable.key, SUPER_PERMISSION_KEY))
        .limit(1);
    }
    const superPermissionId = permissionRows[0]!.id;

    // 2. 确保超级管理员角色存在
    let roleRows = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.name, SUPER_ROLE_NAME))
      .limit(1);

    if (roleRows.length === 0) {
      await db.insert(rolesTable).values({
        name: SUPER_ROLE_NAME,
        note: '系统内置角色，拥有全部权限',
        status: ROLE_STATUS.ACTIVE.value,
      });
      roleRows = await db
        .select({ id: rolesTable.id })
        .from(rolesTable)
        .where(eq(rolesTable.name, SUPER_ROLE_NAME))
        .limit(1);
    }
    const superRoleId = roleRows[0]!.id;

    // 2.1 确保角色-超级权限绑定存在
    const superBind = await db
      .select({ permissionId: rolePermissionsTable.permissionId })
      .from(rolePermissionsTable)
      .where(eq(rolePermissionsTable.roleId, superRoleId));

    if (!superBind.some((b) => b.permissionId === superPermissionId)) {
      await db.insert(rolePermissionsTable).values({
        roleId: superRoleId,
        permissionId: superPermissionId,
      });
    }

    // 3. 若初始管理员没有任何角色，则为其绑定超级管理员
    const firstEmployee = await db
      .select({ id: employeesTable.id })
      .from(employeesTable)
      .orderBy(asc(employeesTable.id))
      .limit(1);

    if (firstEmployee.length > 0) {
      const adminId = firstEmployee[0]!.id;
      const adminRoles = await db
        .select({ roleId: employeeRolesTable.roleId })
        .from(employeeRolesTable)
        .where(eq(employeeRolesTable.employeeId, adminId))
        .limit(1);

      if (adminRoles.length === 0) {
        await db.insert(employeeRolesTable).values({
          employeeId: adminId,
          roleId: superRoleId,
        });
        logger?.info({ adminId, superRoleId }, 'RBAC 引导：已为初始管理员绑定超级管理员角色');
      }
    }
  } catch (error) {
    // 引导失败不应阻断服务启动，仅记录日志
    logger?.warn({ err: error }, 'RBAC 引导执行失败');
  }
}
