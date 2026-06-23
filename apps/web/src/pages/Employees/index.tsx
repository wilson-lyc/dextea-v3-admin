import { useCallback, useEffect, useState } from "react"
import { Loader2Icon, PlusIcon, PencilIcon, BanIcon, CheckCircleIcon } from "lucide-react"
import { toast } from "sonner"

import type { User, UserStatus, ApiResponse, PaginatedData } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
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
import { apiGet, apiPost, apiPut, apiPatch } from "@/lib/api"

type DialogMode = "create" | "edit"

interface CreateResponse {
  user: User
  initialPassword: string
}

export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>("create")
  const [editUserId, setEditUserId] = useState<number | null>(null)
  const [formEmail, setFormEmail] = useState("")
  const [formDisplayName, setFormDisplayName] = useState("")
  const [formStatus, setFormStatus] = useState<UserStatus>(0)
  const [submitting, setSubmitting] = useState(false)

  // Password dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [initialPassword, setInitialPassword] = useState("")

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiGet<ApiResponse<PaginatedData<User>>>("/users")
      setUsers(res.data.items)
      setTotal(res.data.total)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取用户列表失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Open create dialog
  const openCreateDialog = () => {
    setDialogMode("create")
    setEditUserId(null)
    setFormEmail("")
    setFormDisplayName("")
    setFormStatus(0)
    setDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setDialogMode("edit")
    setEditUserId(user.id)
    setFormEmail(user.email)
    setFormDisplayName(user.displayName)
    setFormStatus(user.status)
    setDialogOpen(true)
  }

  // Handle form submit
  const handleSubmit = async () => {
    if (!formEmail || !formDisplayName) {
      toast.error("请填写所有必填字段")
      return
    }

    setSubmitting(true)
    try {
      if (dialogMode === "create") {
        const res = await apiPost<ApiResponse<CreateResponse>>("/users", {
          email: formEmail,
          displayName: formDisplayName,
        })
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
        const res = await apiPut<ApiResponse<{ id: number }>>(`/users/${editUserId}`, {
          email: formEmail,
          displayName: formDisplayName,
          status: formStatus,
        })
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
      const res = await apiPatch<ApiResponse<{ status: UserStatus }>>(`/users/${user.id}/status`)
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
    <div className="flex flex-col gap-6">
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
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
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
                        user.status === 1
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }
                    >
                      {user.status === 1 ? "激活" : "禁用"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                        <PencilIcon data-icon="inline-start" />
                        编辑
                      </Button>
                      <Button
                        variant={user.status === 1 ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                        className={user.status === 0 ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {user.status === 1 ? (
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

          <div className="flex flex-col gap-4 py-2">
            {/* ID field (edit mode only) */}
            {dialogMode === "edit" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-id">ID</Label>
                <Input id="edit-id" value={editUserId ?? ""} disabled />
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-email">邮箱</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="请输入邮箱地址"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            {/* DisplayName */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-display-name">用户名</Label>
              <Input
                id="user-display-name"
                placeholder="请输入用户名"
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
              />
            </div>

            {/* Status (edit mode only) */}
            {dialogMode === "edit" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="user-status">状态</Label>
                <Select
                  value={String(formStatus)}
                  onValueChange={(val: string) => setFormStatus(Number(val) as UserStatus)}
                >
                  <SelectTrigger id="user-status" className="w-full">
                     <SelectValue>{formStatus === 1 ? "激活" : "禁用"}</SelectValue>
                   </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">禁用</SelectItem>
                    <SelectItem value="1">激活</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

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
