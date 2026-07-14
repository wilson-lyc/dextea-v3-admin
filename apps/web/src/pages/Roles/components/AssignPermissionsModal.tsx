import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"

import type { Role, PermissionOption } from "@/api"
import { getPermissionOptions, getRolePermissions, setRolePermissions } from "@/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

interface AssignPermissionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onAssigned: () => void
}

interface PermissionGroup {
  resource: string
  items: PermissionOption[]
}

export default function AssignPermissionsModal({
  open,
  onOpenChange,
  role,
  onAssigned,
}: AssignPermissionsModalProps) {
  const [allPermissions, setAllPermissions] = useState<PermissionOption[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 按资源前缀分组展示（如 employee:read -> 组 "employee"）
  const groups = useMemo<PermissionGroup[]>(() => {
    const map = new Map<string, PermissionOption[]>()
    for (const p of allPermissions) {
      const resource = p.key.includes(":") ? p.key.split(":")[0] : p.key
      const list = map.get(resource) ?? []
      list.push(p)
      map.set(resource, list)
    }
    return Array.from(map.entries()).map(([resource, items]) => ({ resource, items }))
  }, [allPermissions])

  useEffect(() => {
    if (!open || !role) return
    setLoading(true)
    setSubmitting(false)
    Promise.all([getPermissionOptions(), getRolePermissions(role.id)])
      .then(([optionsRes, currentRes]) => {
        if (optionsRes.code !== 0) {
          toast.error(optionsRes.message)
          return
        }
        if (currentRes.code !== 0) {
          toast.error(currentRes.message)
          return
        }
        setAllPermissions(optionsRes.data.items)
        setSelectedIds(new Set(currentRes.data.permissionIds))
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "数据加载异常")
      })
      .finally(() => setLoading(false))
  }, [open, role])

  const togglePermission = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!role) return
    setSubmitting(true)
    try {
      const res = await setRolePermissions(role.id, { permissionIds: Array.from(selectedIds) })
      if (res.code === 0) {
        toast.success(res.message || "权限已更新")
        onOpenChange(false)
        onAssigned()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "系统异常，稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>分配权限</DialogTitle>
          <DialogDescription>
            为「{role?.name}」勾选所需权限，提交后将全量覆盖已有绑定（{selectedIds.size} 项已选）
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="max-h-[55vh] pr-2">
            <div className="flex flex-col gap-4 py-1">
              {groups.map((group) => (
                <div key={group.resource} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      {group.resource}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {group.items.length} 项
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 pl-1 sm:grid-cols-2">
                    {group.items.map((p) => (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60"
                      >
                        <Checkbox
                          checked={selectedIds.has(p.id)}
                          onCheckedChange={() => togglePermission(p.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{p.name}</span>
                          <span className="block truncate font-mono text-xs text-muted-foreground">
                            {p.key}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading || submitting}>
            {submitting ? "提交中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
