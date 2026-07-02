import { useCallback, useEffect, useState } from "react"
import { PlusIcon, PencilIcon, BanIcon, CheckCircleIcon, UsersIcon, SearchIcon, RotateCwIcon } from "lucide-react"
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
import { StatusSelectPicker } from "@/components/ui/status-select-picker"
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
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
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
  const [keyword, setKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
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
      const params: { page?: number; pageSize?: number; keyword?: string } = { page: targetPage, pageSize }
      if (searchKeyword) {
        params.keyword = searchKeyword
      }
      const res = await getUsers(params)
      if (res.code === 0) {
        setUsers(res.data.items)
        setTotal(res.data.total)
        setPage(targetPage)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取用户列表失败")
    } finally {
      setLoading(false)
    }
  }, [searchKeyword, pageSize])

  useEffect(() => {
    fetchUsers(1)
  }, [fetchUsers])

  const handleSearch = () => {
    setSearchKeyword(keyword)
  }

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
          await fetchUsers(page)
        } else {
          toast.error(res.message)
        }
      } else {
        const res = await updateUser(editUserId!, { email: formEmail, displayName: formDisplayName, status: formStatus })
        if (res.code === 0) {
          toast.success(res.message)
          setDialogOpen(false)
          await fetchUsers(page)
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
    <div className="flex h-full flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={openCreateDialog}>
            <PlusIcon data-icon="inline-start" />
            创建用户
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => { setLoading(true); setTimeout(() => fetchUsers(page), 1000) }}
          >
            <RotateCwIcon className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索邮箱、用户名"
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
      </div>

      {/* Table */}
      <div className="flex flex-1 flex-col overflow-auto rounded-lg border">
        <Table className={`base-class ${(users.length === 0 || loading) && 'flex-1'}`}>
          <TableHeader>
            <TableRow className="sticky top-0 bg-background">
              <TableHead className="w-24">ID</TableHead>
              <TableHead className="w-24">邮箱</TableHead>
              <TableHead className="w-24">用户名</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="h-96">
                  <div className="flex items-center justify-center">
                    <Spinner className="size-6 text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : users.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="h-96">
                  <div className="flex items-center justify-center">
                    <Empty>
                      <EmptyMedia variant="icon">
                        <UsersIcon className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>暂无数据</EmptyTitle>
                    </Empty>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
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
                        variant={user.status === USER_STATUS.ACTIVE.value ? "outline-destructive" : "outline-success"}
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
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
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      {/* Pagination */}
      {users.length > 0 && (() => {
        const totalPages = Math.ceil(total / pageSize)
        const pages: (number | "...")[] = []
        if (totalPages <= 6) {
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
        return (
          <Pagination className="shrink-0 justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text="上一页"
                  onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page > 1) fetchUsers(page - 1) }}
                />
              </PaginationItem>
              {pages.map((p, idx) =>
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
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  text="下一页"
                  onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page < totalPages) fetchUsers(page + 1) }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )
      })()}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "创建用户" : "编辑用户"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "填写新用户的信息，创建后系统将自动生成初始密码"
                : "修改用户的信息"}
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
                <StatusSelectPicker
                  statusEnum={USER_STATUS}
                  labels={{ [USER_STATUS.DISABLED.value]: "禁用", [USER_STATUS.ACTIVE.value]: "激活" }}
                  value={String(formStatus)}
                  onValueChange={(val) => setFormStatus(Number(val) as UserStatus)}
                  placeholder="请选择状态"
                  className="w-full"
                />
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
