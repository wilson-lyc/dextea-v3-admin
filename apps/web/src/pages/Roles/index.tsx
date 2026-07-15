import { useCallback, useEffect, useState } from "react"
import {
  KeyRoundIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import type { Role } from "@/api"
import {
  ROLE_STATUS,
  ROLE_STATUS_LABEL,
  ROLE_STATUS_TEXT_CLASSES,
} from "@dextea-admin/contracts/status"
import {
  deleteRole,
  getRoles,
  toggleRoleStatus,
} from "@/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import CreateRoleModal from "./components/CreateRoleModal"
import EditRoleModal from "./components/EditRoleModal"
import AssignPermissionsModal from "./components/AssignPermissionsModal"

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // 弹窗状态
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assigningRole, setAssigningRole] = useState<Role | null>(null)

  // 确认弹窗状态
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [statusOpen, setStatusOpen] = useState(false)
  const [statusRole, setStatusRole] = useState<Role | null>(null)

  const fetchRoles = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const params: { page?: number; pageSize?: number; keyword?: string } = {
        page: targetPage,
        pageSize,
      }
      if (searchKeyword) params.keyword = searchKeyword
      const res = await getRoles(params)
      if (res.code === 0) {
        setRoles(res.data.items)
        setTotal(res.data.total)
        setPage(targetPage)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "系统异常，稍后重试")
    } finally {
      setLoading(false)
    }
  }, [searchKeyword, pageSize])

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await fetchRoles(page)
    toast.success("刷新成功")
  }, [fetchRoles, page])

  useEffect(() => {
    fetchRoles(1)
  }, [fetchRoles])

  const handleSearch = () => setSearchKeyword(keyword)

  const openEdit = (role: Role) => {
    setEditingRole(role)
    setEditOpen(true)
  }

  const openAssign = (role: Role) => {
    setAssigningRole(role)
    setAssignOpen(true)
  }

  const openDelete = (role: Role) => {
    setDeletingRole(role)
    setDeleteError(null)
    setDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingRole) return
    const role = deletingRole
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await deleteRole(role.id)
      if (res.code === 0) {
        toast.success(res.message || "删除成功")
        setDeleteOpen(false)
        setDeletingRole(null)
        fetchRoles(page)
      } else {
        setDeleteError(res.message)
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "删除异常")
    } finally {
      setDeleting(false)
    }
  }

  const openToggleStatus = (role: Role) => {
    setStatusRole(role)
    setStatusOpen(true)
  }

  const handleConfirmToggleStatus = async () => {
    if (!statusRole) return
    const role = statusRole
    setStatusOpen(false)
    setStatusRole(null)
    const target =
      role.status === ROLE_STATUS.ACTIVE.value
        ? ROLE_STATUS.DISABLED.value
        : ROLE_STATUS.ACTIVE.value
    try {
      const res = await toggleRoleStatus(role.id, target)
      if (res.code === 0) {
        toast.success(res.message)
        setRoles((prev) =>
          prev.map((r) => (r.id === role.id ? { ...r, status: res.data.status } : r)),
        )
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "系统异常，稍后重试")
    }
  }

  return (
    <>
      <DataTable
        className="p-6"
        toolbarLeft={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            新建角色
          </Button>
        }
        toolbarRight={
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索角色名称"
                className="pl-8"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch()
                }}
              />
            </div>
            <Button variant="secondary" onClick={handleSearch}>
              搜索
            </Button>
            {searchKeyword && (
              <Button
                variant="ghost"
                onClick={() => {
                  setKeyword("")
                  setSearchKeyword("")
                }}
              >
                清除
              </Button>
            )}
          </div>
        }
        header={
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>角色名称</TableHead>
              <TableHead>备注</TableHead>
              <TableHead className="w-20">状态</TableHead>
              <TableHead className="w-36">创建时间</TableHead>
              <TableHead className="w-64 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={roles.map((role) => (
          <TableRow key={role.id}>
            <TableCell className="font-mono text-xs">{role.id}</TableCell>
            <TableCell className="font-medium">{role.name}</TableCell>
            <TableCell className="text-muted-foreground">{role.note || "—"}</TableCell>
            <TableCell>
              <span className={ROLE_STATUS_TEXT_CLASSES[role.status] ?? ""}>
                {ROLE_STATUS_LABEL[role.status]}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">{role.createdAt}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="outline" size="sm" onClick={() => openAssign(role)}>
                  <KeyRoundIcon data-icon="inline-start" />
                  分配权限
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                  <PencilIcon data-icon="inline-start" />
                  编辑
                </Button>
                <Button
                  variant={
                    role.status === ROLE_STATUS.ACTIVE.value
                      ? "outline-destructive"
                      : "outline-success"
                  }
                  size="sm"
                  onClick={() => openToggleStatus(role)}
                >
                  {role.status === ROLE_STATUS.ACTIVE.value ? "禁用" : "启用"}
                </Button>
                <Button
                  variant="outline-destructive"
                  size="sm"
                  onClick={() => openDelete(role)}
                >
                  <Trash2Icon data-icon="inline-start" />
                  删除
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={roles.length === 0}
        colSpan={6}
        onRefresh={handleRefresh}
        refreshDisabled={loading}
        emptyIcon={<ShieldCheckIcon className="size-4" />}
        emptyText="暂无角色"
        pagination={{ page, pageSize, total, onPageChange: fetchRoles }}
      />

      <CreateRoleModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => fetchRoles(page)}
      />
      <EditRoleModal
        open={editOpen}
        onOpenChange={setEditOpen}
        role={editingRole}
        onUpdated={() => fetchRoles(page)}
      />
      <AssignPermissionsModal
        open={assignOpen}
        onOpenChange={setAssignOpen}
        role={assigningRole}
        onAssigned={() => {}}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="删除角色"
        description={
          <>
            确定要删除角色「<span className="font-semibold text-foreground">{deletingRole?.name}</span>
            」吗？该角色与员工、权限的关联关系将一并解除。
          </>
        }
        confirmText="删除"
        variant="destructive"
        loading={deleting}
        errorMessage={deleteError}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        title={`${statusRole?.status === ROLE_STATUS.ACTIVE.value ? "禁用" : "启用"}角色`}
        description={`确定${statusRole?.status === ROLE_STATUS.ACTIVE.value ? "禁用" : "启用"}角色「${statusRole?.name}」吗？`}
        confirmText="确定"
        variant="default"
        onConfirm={handleConfirmToggleStatus}
      />
    </>
  )
}
