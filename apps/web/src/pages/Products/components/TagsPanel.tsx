import { useCallback, useEffect, useState } from "react"
import { Trash2Icon, LinkIcon, TagIcon } from "lucide-react"
import { toast } from "sonner"

import type { ProductTag } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { getProductTags, removeProductTag } from "@/services"
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
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取标签失败")
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
        toast.success(res.message)
        setDeleteConfirmOpen(false)
        setDeletingTag(null)
        await fetchTags(page)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "解绑失败")
    }
  }

  // 已绑标签 ID 集合（供 AddTagDialog 排除已选项）
  const existingTagIds = tags.map((t) => t.id)

  return (
    <div className="flex flex-col gap-4">
      {/* 顶部操作栏：新增标签按钮 + 总数统计 */}
      <div className="flex items-center justify-between">
        <Button onClick={() => setAddTagDialogOpen(true)}>
          <LinkIcon data-icon="inline-start" />
              绑定标签
        </Button>
        {!loading && <span className="text-sm text-muted-foreground">共 {total} 个标签</span>}
      </div>

      {/* 标签列表表格（加载态 / 空态 / 列表） */}
      <ScrollArea className="max-h-[calc(100vh-480px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标签名称</TableHead>
              <TableHead className="w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // 加载中状态
              <TableRow>
                <TableCell colSpan={2} className="h-32 text-center text-sm text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
            ) : tags.length === 0 ? (
              // 空数据状态
              <TableRow>
                <TableCell colSpan={2} className="h-48 text-center">
                  <Empty>
                    <EmptyMedia variant="icon">
                      <TagIcon className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>暂无数据</EmptyTitle>
                    <Button onClick={() => setAddTagDialogOpen(true)}>
                      立即绑定
                    </Button>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              // 标签列表行
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>{tag.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline-destructive"
                      size="sm"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <Trash2Icon className="size-4" data-icon="inline-start" />
                      解绑
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* 分页组件（仅在有数据时显示） */}
      {!loading && tags.length > 0 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  if (page > 1) fetchTags(page - 1)
                }}
                text="上一页"
              />
            </PaginationItem>
            {(() => {
              const totalPages = Math.ceil(total / pageSize)
              const pages: (number | "...")[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (page > 3) pages.push("...")
                for (
                  let i = Math.max(2, page - 1);
                  i <= Math.min(totalPages - 1, page + 1);
                  i++
                ) {
                  pages.push(i)
                }
                if (page < totalPages - 2) pages.push("...")
                pages.push(totalPages)
              }
              return pages.map((p, idx) =>
                p === "..." ? (
                  <PaginationItem key={`e-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault()
                        fetchTags(p)
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )
            })()}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  if (page < Math.ceil(total / pageSize)) fetchTags(page + 1)
                }}
                text="下一页"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AddTagDialog
        open={addTagDialogOpen}
        onOpenChange={setAddTagDialogOpen}
        productId={productId}
        existingTagIds={existingTagIds}
        onAdded={() => fetchTags(page)}
      />

      {/* 确认解绑弹窗 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认解绑</DialogTitle>
            <DialogDescription>
              确定要解除标签「{deletingTag?.name}」与当前商品的绑定关系吗？
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
            >
              确认解绑
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
