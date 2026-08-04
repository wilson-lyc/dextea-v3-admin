import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"

import type { Employee, RoleOption } from "@/api"
import { getEmployeeRoles, getRoleOptions, setEmployeeRoles } from "@/api"
import { logger, extractBackendMessage } from "@/lib/logger"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface AssignRolesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  onAssigned: () => void
}

export default function AssignRolesModal({
  open,
  onOpenChange,
  employee,
  onAssigned,
}: AssignRolesModalProps) {
  const [allRoles, setAllRoles] = useState<RoleOption[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !employee) return
    setLoading(true)
    setSubmitting(false)
    Promise.all([getRoleOptions(), getEmployeeRoles(employee.id)])
      .then(([optionsRes, currentRes]) => {
        setAllRoles(optionsRes.data.items)
        setSelectedIds(new Set(currentRes.data.roleIds))
      })
      .catch((err) => {
        logger.error(extractBackendMessage(err) ?? "未知错误", {
          module: "员工",
          label: "加载分配角色数据",
        })
        toast.error("数据加载异常，请稍后重试")
      })
      .finally(() => setLoading(false))
  }, [open, employee])

  const toggleRole = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!employee) return
    setSubmitting(true)
    try {
      const res = await setEmployeeRoles(employee.id, { roleIds: Array.from(selectedIds) })
      if (res.code === 0) {
        toast.success(res.message || "角色已更新")
        onOpenChange(false)
        onAssigned()
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "员工",
        label: "分配角色",
      })
      toast.error("保存角色失败，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>分配角色</DialogTitle>
          <DialogDescription>
            为「{employee?.displayName}」分配角色（{selectedIds.size} 项已选）
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : allRoles.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            暂无可用角色，请先在「角色管理」中创建
          </div>
        ) : (
          <ScrollArea className="max-h-[55vh] pr-2">
            <div className="flex flex-col gap-1.5 py-1">
              {allRoles.map((role) => (
                <label
                  key={role.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-muted/60"
                >
                  <Checkbox
                    checked={selectedIds.has(role.id)}
                    onCheckedChange={() => toggleRole(role.id)}
                  />
                  <span className="flex-1 text-sm">{role.name}</span>
                </label>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading || submitting}>
            {submitting ? <Spinner data-icon="inline-start" /> : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
