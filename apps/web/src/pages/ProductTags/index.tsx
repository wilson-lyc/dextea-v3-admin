import { useCallback, useEffect, useState } from "react"
import { PlusIcon, PencilIcon, Trash2Icon, TagIcon, LinkIcon } from "lucide-react"
import { toast } from "sonner"

import type { ProductTag, CreateTagInput, UpdateTagInput } from "@/api"
import { Button } from "@/components/ui/button"
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"
import { getTags, createTag, updateTag, deleteTag } from "@/api"
import ProductBindingSheet from "./components/ProductBindingSheet"

type DialogMode = "create" | "edit"

export default function TagListPage() {
  const [tags, setTags] = useState<ProductTag[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

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

  // Product binding sheet state
  const [bindingSheetOpen, setBindingSheetOpen] = useState(false)
  const [bindingTag, setBindingTag] = useState<ProductTag | null>(null)

  const fetchTags = useCallback(async (targetPage: number = 1) => {
    setLoading(true)
    try {
      const res = await getTags({ page: targetPage, pageSize })
      setTags(res.data.items)
      setTotal(res.data.total)
      setPage(res.data.page)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取标签列表失败")
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshTags = useCallback(async (targetPage: number) => {
    if (loading) return
    await fetchTags(targetPage)
    toast.success('数据已更新')
  }, [loading, fetchTags])

  useEffect(() => {
    fetchTags(1)
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

  // Open product binding sheet
  const openBindingSheet = (tag: ProductTag) => {
    setBindingTag(tag)
    setBindingSheetOpen(true)
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
    <>
      <DataTable
        className="p-6"
        toolbarLeft={
          <>
            <Button onClick={openCreateDialog}>
              <PlusIcon data-icon="inline-start" />
              新增标签
            </Button>
          </>
        }
        header={
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              <TableHead className="w-20">标签ID</TableHead>
              <TableHead>标签名称</TableHead>
              <TableHead className="w-24">关联商品</TableHead>
              <TableHead className="w-48 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={tags.map((tag) => (
          <TableRow key={tag.id}>
            <TableCell className="font-mono text-xs">{tag.id}</TableCell>
            <TableCell>{tag.name}</TableCell>
            <TableCell>{tag.boundCount}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(tag)}
                >
                  <PencilIcon data-icon="inline-start" />
                  重命名
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openBindingSheet(tag)}
                >
                  <LinkIcon data-icon="inline-start" />
                关联商品
                </Button>
                <Button
                  variant="outline-destructive"
                  size="sm"
                  onClick={() => openDeleteDialog(tag)}
                >
                  <Trash2Icon data-icon="inline-start" />
                  删除
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={tags.length === 0}
        colSpan={4}
        onRefresh={() => refreshTags(page)}
        refreshDisabled={loading}
        emptyIcon={<TagIcon className="size-4" />}
        emptyText="暂无数据"
        pagination={{ page, pageSize, total, onPageChange: fetchTags }}
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "新增标签" : "编辑标签"}</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            {/* Name */}
            <Field>
              <FieldLabel htmlFor="tag-name">
                标签名称 <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="tag-name"
                placeholder="请输入标签名称"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit()
                }}
              />
            </Field>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除标签「{deletingTag?.name}」吗？删除后，关联该标签的商品不会被删除。此操作不可撤销！
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

      <ProductBindingSheet
        tagId={bindingTag?.id ?? 0}
        tagName={bindingTag?.name ?? ""}
        open={bindingSheetOpen}
        onOpenChange={(open) => {
          setBindingSheetOpen(open)
          if (!open) fetchTags(page)
        }}
      />
    </>
  )
}
