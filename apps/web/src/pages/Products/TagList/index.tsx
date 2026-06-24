import { useCallback, useEffect, useState } from "react"
import { Loader2Icon, PlusIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import type { ProductTag, CreateTagInput, UpdateTagInput } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { getTags, createTag, updateTag, deleteTag } from "@/services"

type DialogMode = "create" | "edit"

export default function TagListPage() {
  const [tags, setTags] = useState<ProductTag[]>([])
  const [loading, setLoading] = useState(true)

  // Create / Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>("create")
  const [editingTag, setEditingTag] = useState<ProductTag | null>(null)
  const [formName, setFormName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTag, setDeletingTag] = useState<ProductTag | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTags = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getTags()
      setTags(res.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取标签列表失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  // Open create dialog
  const openCreateDialog = () => {
    setDialogMode("create")
    setEditingTag(null)
    setFormName("")
    setDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (tag: ProductTag) => {
    setDialogMode("edit")
    setEditingTag(tag)
    setFormName(tag.name)
    setDialogOpen(true)
  }

  // Open delete confirmation
  const openDeleteDialog = (tag: ProductTag) => {
    setDeletingTag(tag)
    setDeleteDialogOpen(true)
  }

  // Handle create / edit submit
  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error("请输入标签名称")
      return
    }

    setSubmitting(true)
    try {
      if (dialogMode === "create") {
        const payload: CreateTagInput = { name: formName.trim() }
        const res = await createTag(payload)
        if (res.code === 0) {
          toast.success(res.message)
          setDialogOpen(false)
          await fetchTags()
        } else {
          toast.error(res.message)
        }
      } else {
        const payload: UpdateTagInput = { name: formName.trim() }
        const res = await updateTag(editingTag!.id, payload)
        if (res.code === 0) {
          toast.success(res.message)
          setDialogOpen(false)
          await fetchTags()
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

  // Handle delete
  const handleDelete = async () => {
    if (!deletingTag) return

    setDeleting(true)
    try {
      const res = await deleteTag(deletingTag.id)
      if (res.code === 0) {
        toast.success(res.message)
        setDeleteDialogOpen(false)
        setDeletingTag(null)
        await fetchTags()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={openCreateDialog}>
          <PlusIcon data-icon="inline-start" />
          新增标签
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
              <TableHead className="w-20">ID</TableHead>
              <TableHead>标签名称</TableHead>
              <TableHead className="w-48 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  暂无标签数据
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-mono text-xs">{tag.id}</TableCell>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(tag)}
                      >
                        <PencilIcon data-icon="inline-start" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-500"
                        onClick={() => openDeleteDialog(tag)}
                      >
                        <Trash2Icon data-icon="inline-start" />
                        删除
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
            <DialogTitle>{dialogMode === "create" ? "新增标签" : "编辑标签"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* ID field (edit mode only) */}
            {dialogMode === "edit" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="tag-id">ID</Label>
                <Input id="tag-id" value={editingTag?.id ?? ""} disabled />
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="tag-name">
                标签名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tag-name"
                placeholder="请输入标签名称"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit()
                }}
              />
            </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除标签「{deletingTag?.name}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
