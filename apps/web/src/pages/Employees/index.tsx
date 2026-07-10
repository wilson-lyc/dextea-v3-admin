import { useCallback, useEffect, useState } from "react"
import { PlusIcon, PencilIcon, BanIcon, CheckCircleIcon, UsersIcon, SearchIcon, RotateCwIcon } from "lucide-react"
import { toast } from "sonner"

import type { Employee } from "@/api"
import { EMPLOYEE_STATUS, EMPLOYEE_STATUS_LABEL, EMPLOYEE_STATUS_TEXT_CLASSES } from "@/lib/status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import PaginationBar from "@/components/ui/pagination-bar"
import { getEmployees, toggleEmployeeStatus } from "@/api"
import CreateEmployeeModal from "./components/CreateEmployeeModal"
import EditEmployeeModal from "./components/EditEmployeeModal"
import ConfirmDialog from "@/components/ui/confirm-dialog"

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  // Password dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [initialPassword, setInitialPassword] = useState("")

  // Confirm toggle status dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmEmployee, setConfirmEmployee] = useState<Employee | null>(null)

  const fetchEmployees = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const params: { page?: number; pageSize?: number; keyword?: string } = { page: targetPage, pageSize }
      if (searchKeyword) {
        params.keyword = searchKeyword
      }
      const res = await getEmployees(params)
      if (res.code === 0) {
        setEmployees(res.data.items)
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

  useEffect(() => {
    fetchEmployees(1)
  }, [fetchEmployees])

  const handleSearch = () => {
    setSearchKeyword(keyword)
  }

  // Open create dialog
  const openCreateDialog = () => {
    setCreateDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee)
    setEditDialogOpen(true)
  }

  // Open confirm dialog for toggling status
  const handleToggleStatus = (employee: Employee) => {
    setConfirmEmployee(employee)
    setConfirmDialogOpen(true)
  }

  // Actually toggle employee status after confirmation
  const handleConfirmToggleStatus = async () => {
    if (!confirmEmployee) return
    const employee = confirmEmployee
    setConfirmDialogOpen(false)
    setConfirmEmployee(null)
    try {
      const res = await toggleEmployeeStatus(employee.id)
      if (res.code === 0) {
        toast.success(res.message)
        setEmployees((prev) =>
          prev.map((e) => (e.id === employee.id ? { ...e, status: res.data.status } : e))
        )
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "系统异常，稍后重试")
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
            onClick={() => { setLoading(true); setTimeout(() => fetchEmployees(page), 1000) }}
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
        <Table className={`table-fixed ${(employees.length === 0 || loading) && 'flex-1'}`}>
          <TableHeader>
            <TableRow className="sticky top-0 z-50 bg-background">
              <TableHead className="w-20">ID</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead className="w-20">状态</TableHead>
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
          ) : employees.length === 0 ? (
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
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-mono text-xs">{employee.id}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.displayName}</TableCell>
                  <TableCell>
                    <span className={EMPLOYEE_STATUS_TEXT_CLASSES[employee.status] ?? ""}>
                      {EMPLOYEE_STATUS_LABEL[employee.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(employee)}>
                        <PencilIcon data-icon="inline-start" />
                        编辑
                      </Button>
                      <Button
                        variant={employee.status === EMPLOYEE_STATUS.ACTIVE.value ? "outline-destructive" : "outline-success"}
                        size="sm"
                        onClick={() => handleToggleStatus(employee)}
                      >
                        {employee.status === EMPLOYEE_STATUS.ACTIVE.value ? (
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
      {employees.length > 0 && (
        <PaginationBar
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={fetchEmployees}
          className="shrink-0 justify-end"
        />
      )}

      {/* Create / Edit Dialogs */}
      <CreateEmployeeModal
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={(initialPassword) => {
          setInitialPassword(initialPassword)
          setPasswordDialogOpen(true)
          fetchEmployees(page)
        }}
      />
      <EditEmployeeModal
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        employee={selectedEmployee}
        onUpdated={() => fetchEmployees(page)}
      />

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
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm toggle status dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="确认操作"
        description={`确定${confirmEmployee?.status === EMPLOYEE_STATUS.ACTIVE.value ? "禁用" : "激活"} ${confirmEmployee?.displayName} 吗？`}
        confirmText="确定"
        variant="default"
        onConfirm={handleConfirmToggleStatus}
      />
    </div>
  )
}
