import { useCallback, useEffect, useState } from "react"
import { PlusIcon, PencilIcon, BanIcon, CheckCircleIcon } from "lucide-react"
import { toast } from "sonner"

import type { User, UserStatus } from "@dextea/shared-types"
import { USER_STATUS } from "@dextea/shared-types"

const USER_STATUS_LABEL: Record<number, string> = {
  [USER_STATUS.DISABLED.value]: "禁用",
  [USER_STATUS.ACTIVE.value]: "激活",
}
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { getUsers, createUser, updateUser, toggleUserStatus } from "@/services"

type DialogMode = "create" | "edit"

export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>("create")
  const [editUserId, setEditUserId] = useState<number | null>(null)
  const [formEmail, setFormEmail] = useState("")
  const [formDisplayName, setFormDisplayName] = useState("")
  const [formStatus, setFormStatus] = useState<UserStatus>(0)
  const [submitting, setSubmitting] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [nameError, setNameError] = useState("")

  // Password dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [initialPassword, setInitialPassword] = useState("")

  const fetchUsers = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getUsers({ page: targetPage, pageSize })
      setUsers(res.data.items)
      setTotal(res.data.total)
      setPage(res.data.page)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取用户列表失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers(1)
  }, [fetchUsers])

  // Open create dialog
  const openCreateDialog = () => {
    setDialogMode("create")
    setEditUserId(null)
    setFormEmail("")
    setFormDisplayName("")
    setFormStatus(0)
    setEmailError("")
    setNameError("")
    setDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setDialogMode("edit")
    setEditUserId(user.id)
    setFormEmail(user.email)
    setFormDisplayName(user.displayName)
    setFormStatus(user.status)
    setEmailError("")
    setNameError("")
    setDialogOpen(true)
  }

  // Handle form submit
  const handleSubmit = async () => {
    let hasError = false

    if (!formEmail) {
      setEmailError("邮箱不能为空")
      hasError = true
    } else {
      setEmailError("")
    }

    if (!formDisplayName) {
      setNameError("用户名不能为空")
      hasError = true
    } else {
      setNameError("")
    }

    if (hasError) return

    setSubmitting(true)
    try {
      if (dialogMode === "create") {
        const res = await createUser({ email: formEmail, displayName: formDisplayName })
        if (res.code === 0) {
          toast.success(res.message)
          setDialogOpen(false)
          // Show initial password dialog
          setInitialPassword(res.data.initialPassword)
          setPasswordDialogOpen(true)
          await fetchUsers()
        } else {
          toast.error(res.message)
        }
      } else {
        const res = await updateUser(editUserId!, { email: formEmail, displayName: formDisplayName, status: formStatus })
        if (res.code === 0) {
          toast.success(res.message)
          setDialogOpen(false)
          await fetchUsers()
        } else {
          toast.error(res.message)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败")
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle user status
  const handleToggleStatus = async (user: User) => {
    try {
      const res = await toggleUserStatus(user.id)
      if (res.code === 0) {
        toast.success(res.message)
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: res.data.status } : u))
        )
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">员工管理</h1>
          <p className="text-sm text-muted-foreground">共 {total} 名员工</p>
        </div>
        <Button onClick={openCreateDialog}>
          <PlusIcon data-icon="inline-start" />
          创建用户
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  暂无员工数据
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs">{user.id}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>
                    <span
                      className={
                        user.status === USER_STATUS.ACTIVE.value
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }
                    >
                      {USER_STATUS_LABEL[user.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                        <PencilIcon data-icon="inline-start" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                        className={user.status === USER_STATUS.ACTIVE.value ? "text-red-500 hover:text-red-500" : "text-green-600 hover:text-green-600"}
                      >
                        {user.status === USER_STATUS.ACTIVE.value ? (
                          <>
                            <BanIcon data-icon="inline-start" />
                            禁用
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon data-icon="inline-start" />
                            激活
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {!loading && users.length > 0 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page > 1) fetchUsers(page - 1) }}
                text="上一页"
              />
            </PaginationItem>
            {(() => {
              const totalPages = Math.ceil(total / pageSize)
              const pages: (number | "...")[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (page > 3) pages.push("...")
                for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                  pages.push(i)
                }
                if (page < totalPages - 2) pages.push("...")
                pages.push(totalPages)
              }
              return pages.map((p, idx) =>
                p === "..." ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e: React.MouseEvent) => { e.preventDefault(); fetchUsers(p) }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )
            })()}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page < Math.ceil(total / pageSize)) fetchUsers(page + 1) }}
                text="下一页"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "创建用户" : "编辑用户"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "填写新用户的信息，创建后系统将自动生成初始密码。"
                : "修改用户的信息。"}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-2">
            {/* ID field (edit mode only) */}
            {dialogMode === "edit" && (
              <Field data-disabled>
                <FieldLabel htmlFor="edit-id">ID</FieldLabel>
                <Input id="edit-id" value={editUserId ?? ""} disabled />
              </Field>
            )}

            {/* Email */}
            <Field data-invalid={!!emailError || undefined}>
              <FieldLabel htmlFor="user-email">
                邮箱 <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="user-email"
                type="email"
                placeholder="请输入邮箱地址"
                value={formEmail}
                onChange={(e) => {
                  setFormEmail(e.target.value)
                  if (emailError) setEmailError("")
                }}
                aria-invalid={!!emailError || undefined}
              />
              {emailError && <FieldError>{emailError}</FieldError>}
            </Field>

            {/* DisplayName */}
            <Field data-invalid={!!nameError || undefined}>
              <FieldLabel htmlFor="user-display-name">
                用户名 <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="user-display-name"
                placeholder="请输入用户名"
                value={formDisplayName}
                onChange={(e) => {
                  setFormDisplayName(e.target.value)
                  if (nameError) setNameError("")
                }}
                aria-invalid={!!nameError || undefined}
              />
              {nameError && <FieldError>{nameError}</FieldError>}
            </Field>

            {/* Status (edit mode only) */}
            {dialogMode === "edit" && (
              <Field>
                <FieldLabel htmlFor="user-status">
                  状态 <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={String(formStatus)}
                  onValueChange={(val) => setFormStatus(Number(val) as UserStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="请选择状态">
                      {USER_STATUS_LABEL[formStatus]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(USER_STATUS).map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {USER_STATUS_LABEL[opt.value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "提交中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initial Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建成功</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-4">
            <div className="rounded-lg border bg-muted px-6 py-3 font-mono text-lg tracking-widest">
              {initialPassword}
            </div>
            <p className="text-xs text-destructive font-medium">
              此密码仅显示一次，关闭后将不再显示
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => setPasswordDialogOpen(false)}>
              我已保存，关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
