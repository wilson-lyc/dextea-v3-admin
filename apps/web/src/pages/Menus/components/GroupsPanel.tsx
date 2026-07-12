import { useCallback, useEffect, useState } from "react"
import { PlusIcon, Trash2Icon, LayersIcon, ListIcon, RotateCwIcon } from "lucide-react"
import { toast } from "sonner"

import type { MenuGroup } from "@/api"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import ConfirmDialog from "@/components/ui/confirm-dialog"
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
import { getMenuGroups, createMenuGroup, deleteMenuGroup } from "@/api"
import GroupProductsSheet from "./GroupProductsSheet"

interface GroupsPanelProps {
  menuId: number
}

export default function GroupsPanel({ menuId }: GroupsPanelProps) {
  const [groups, setGroups] = useState<MenuGroup[]>([])
  const [loading, setLoading] = useState(true)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState<MenuGroup | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const [productsSheetOpen, setProductsSheetOpen] = useState(false)
  const [activeGroup, setActiveGroup] = useState<MenuGroup | null>(null)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMenuGroups(menuId)
      setGroups(res.data)
      setSelectedIds(new Set())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取分组列表失败")
    } finally {
      setLoading(false)
    }
  }, [menuId])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const openCreateDialog = () => {
    setFormName("")
    setCreateDialogOpen(true)
  }

  const openDeleteDialog = (group: MenuGroup) => {
    setDeletingGroup(group)
    setDeleteDialogOpen(true)
  }

  const openProductsSheet = (group: MenuGroup) => {
    setActiveGroup(group)
    setProductsSheetOpen(true)
  }

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error("请输入分组名称")
      return
    }

    setSubmitting(true)
    try {
      const res = await createMenuGroup(menuId, { name: formName.trim() })
      if (res.code === 0) {
        toast.success(res.message)
        setCreateDialogOpen(false)
        await fetchGroups()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingGroup) return

    setDeleting(true)
    try {
      const res = await deleteMenuGroup([deletingGroup.id])
      if (res.code === 0) {
        toast.success(res.message)
        setDeleteDialogOpen(false)
        setDeletingGroup(null)
        await fetchGroups()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败")
    } finally {
      setDeleting(false)
    }
  }

  const allSelected = groups.length > 0 && selectedIds.size === groups.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < groups.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(groups.map((g) => g.id)))
    }
  }

  const toggleSelect = (groupId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return

    setBatchDeleting(true)
    try {
      const res = await deleteMenuGroup(Array.from(selectedIds))
      if (res.code === 0) {
        toast.success(res.message)
        setBatchDeleteOpen(false)
        setSelectedIds(new Set())
        await fetchGroups()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "批量删除失败")
    } finally {
      setBatchDeleting(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 flex-1">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={openCreateDialog}>
            <PlusIcon data-icon="inline-start" />
            新增分组
          </Button>
          <Button variant="outline" size="icon" onClick={() => fetchGroups()} disabled={loading}>
            <RotateCwIcon className="size-4" />
          </Button>
        </div>
        {selectedIds.size > 0 && (
          <Button
            variant="outline-destructive"
            onClick={() => setBatchDeleteOpen(true)}
          >
            <Trash2Icon data-icon="inline-start" />
            批量删除（{selectedIds.size}）
          </Button>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-auto rounded-lg border">
        <Table className={`${(groups.length === 0 || loading) ? "flex-1" : ""}`}>
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="全选"
                />
              </TableHead>
              <TableHead className="w-16">分组ID</TableHead>
              <TableHead>分组名称</TableHead>
              <TableHead className="w-24">商品数量</TableHead>
              <TableHead className="w-48 text-right">操作</TableHead>
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
          ) : groups.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="h-96">
                  <div className="flex items-center justify-center">
                    <Empty>
                      <EmptyMedia variant="icon">
                        <LayersIcon className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>暂无分组</EmptyTitle>
                    </Empty>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id} data-state={selectedIds.has(group.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(group.id)}
                      onCheckedChange={() => toggleSelect(group.id)}
                      aria-label={`选择分组 ${group.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{group.id}</TableCell>
                  <TableCell>{group.name}</TableCell>
                  <TableCell>{group.productCount ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openProductsSheet(group)}
                      >
                        <ListIcon data-icon="inline-start" />
                        查看商品
                      </Button>
                      <Button
                        variant="outline-destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(group)}
                      >
                        <Trash2Icon data-icon="inline-start" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增分组</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field>
              <FieldLabel htmlFor="group-name">
                分组名称 <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="group-name"
                placeholder="请输入分组名称"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit()
                }}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "提交中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="确认删除"
        description={`确定要删除分组「${deletingGroup?.name}」吗？该分组下的所有商品关联将被一并移除。此操作不可撤销！`}
        confirmText="确认删除"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={batchDeleteOpen}
        onOpenChange={setBatchDeleteOpen}
        title="确认批量删除"
        description={`确定要删除已选中的 ${selectedIds.size} 个分组吗？这些分组下的所有商品关联将被一并移除。此操作不可撤销！`}
        confirmText="确认删除"
        variant="destructive"
        loading={batchDeleting}
        onConfirm={handleBatchDelete}
      />

      <GroupProductsSheet
        groupId={activeGroup?.id ?? 0}
        groupName={activeGroup?.name ?? ""}
        open={productsSheetOpen}
        onOpenChange={(open) => {
          setProductsSheetOpen(open)
          if (!open) fetchGroups()
        }}
      />
    </div>
  )
}
