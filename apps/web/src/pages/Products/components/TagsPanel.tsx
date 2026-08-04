import { useCallback, useEffect, useState } from "react"
import { LinkIcon, TagIcon } from "lucide-react"
import { toast } from "sonner"

import type { ProductTag } from "@/api"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"
import { getProductTags, removeProductTag } from "@/api"
import { logger, extractBackendMessage } from "@/lib/logger"
import { AddTagDialog } from "./AddTagDialog"

interface TagsPanelProps {
  productId: number
}

export default function TagsPanel({ productId }: TagsPanelProps) {
  // 标签列表 & 分页状态
  const [tags, setTags] = useState<ProductTag[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false)

  // 删除确认弹窗状态
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingTag, setDeletingTag] = useState<{ id: number; name: string } | null>(null)

  // 获取商品标签列表（支持分页）
  const fetchTags = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getProductTags(productId, { page: targetPage, pageSize })
      if (res.code === 0) {
        setTags(res.data.items)
        setTotal(res.data.total)
        setPage(targetPage)
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "获取商品标签列表",
      })
      toast.error("数据加载异常，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [productId, pageSize])

  // 首次加载时获取第 1 页数据
  useEffect(() => {
    fetchTags(1)
  }, [fetchTags])

  // 点击解绑按钮 → 弹出确认框
  const handleRemoveTag = (tag: { id: number; name: string }) => {
    setDeletingTag(tag)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmRemove = async () => {
    if (!deletingTag) return

    try {
      const res = await removeProductTag(productId, deletingTag.id)
      if (res.code === 0) {
        toast.success(res.message || "解绑标签成功")
        setDeleteConfirmOpen(false)
        setDeletingTag(null)
        await fetchTags(page)
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "解绑商品标签",
      })
      toast.error("解绑标签失败，请稍后重试")
    }
  }

  return (
    <>
      <DataTable
        toolbarLeft={
          <Button onClick={() => setAddTagDialogOpen(true)}>
            <LinkIcon data-icon="inline-start" />
              绑定标签
          </Button>
        }
        header={
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              <TableHead>标签名称</TableHead>
              <TableHead className="w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={tags.map((tag) => (
          <TableRow key={tag.id}>
            <TableCell>{tag.name}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline-destructive"
                size="sm"
                onClick={() => handleRemoveTag(tag)}
              >
                解绑
              </Button>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={tags.length === 0}
        colSpan={2}
        hideRefresh
        emptyIcon={<TagIcon className="size-4" />}
        emptyText="暂无数据"
        pagination={{ page, pageSize, total, onPageChange: fetchTags }}
      />

      <AddTagDialog
        open={addTagDialogOpen}
        onOpenChange={setAddTagDialogOpen}
        productId={productId}
        onAdded={() => fetchTags(page)}
      />

      {/* 确认解绑弹窗 */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="操作确认"
        description={`确定要解除标签「${deletingTag?.name}」与当前商品的绑定关系吗？`}
        confirmText="确认"
        onConfirm={handleConfirmRemove}
      />
    </>
  )
}
