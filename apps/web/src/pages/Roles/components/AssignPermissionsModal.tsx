import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { SearchIcon, ShieldCheckIcon } from "lucide-react"

import type { Role, PermissionOption } from "@/api"
import { getPermissionOptions, getRolePermissions, setRolePermissions } from "@/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"

type FilterValue = "all" | "selected" | "unselected"

interface AssignPermissionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onAssigned: () => void
}

export default function AssignPermissionsModal({
  open,
  onOpenChange,
  role,
  onAssigned,
}: AssignPermissionsModalProps) {
  const [allPermissions, setAllPermissions] = useState<PermissionOption[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [keyword, setKeyword] = useState("")
  const [filter, setFilter] = useState<FilterValue>("all")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !role) return
    setLoading(true)
    setSubmitting(false)
    setKeyword("")
    setFilter("all")
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

  // 复合搜索：按名称或键名匹配；再叠加「已选/未选/全部」筛选
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return allPermissions.filter((p) => {
      const matchKeyword =
        !kw ||
        p.name.toLowerCase().includes(kw) ||
        p.key.toLowerCase().includes(kw)
      const matchFilter =
        filter === "all"
          ? true
          : filter === "selected"
            ? selectedIds.has(p.id)
            : !selectedIds.has(p.id)
      return matchKeyword && matchFilter
    })
  }, [allPermissions, keyword, filter, selectedIds])

  const handleSubmit = async () => {
    if (!role) return
    setSubmitting(true)
    try {
      const res = await setRolePermissions(role.id, {
        permissionIds: Array.from(selectedIds),
      })
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
      <DialogContent className="flex w-[40vw] h-[60vh] flex-col">
        <DialogHeader>
          <DialogTitle>权限配置</DialogTitle>
        </DialogHeader>

        <DataTable
          className="flex-1 min-h-0"
          showSelection
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          toolbarLeft={
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as FilterValue)}
              items={{
                all: "所有权限",
                selected: "已选择",
                unselected: "未选择",
              }}
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有权限</SelectItem>
                <SelectItem value="selected">已选择</SelectItem>
                <SelectItem value="unselected">未选择</SelectItem>
              </SelectContent>
            </Select>
          }
          toolbarRight={
            <div className="relative w-full max-w-xs">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索名称或键名"
                className="pl-8"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          }
          header={
            <TableHeader className="sticky top-0 z-50 bg-background">
              <TableRow>
                <TableHead>权限名称</TableHead>
                <TableHead>键名</TableHead>
              </TableRow>
            </TableHeader>
          }
          body={filtered.map((p) => (
            <TableRow key={p.id} data-id={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {p.key}
              </TableCell>
            </TableRow>
          ))}
          loading={loading}
          isEmpty={filtered.length === 0}
          colSpan={2}
          hideRefresh
          emptyIcon={<ShieldCheckIcon className="size-4" />}
          emptyText="无匹配权限"
        />

        <DialogFooter>
          <div className="flex w-full items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              已选 {selectedIds.size} 项
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={loading || submitting}>
                {submitting ? "提交中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
