import { useCallback, useEffect, useState } from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import type { ProductTag } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getProductTags, removeProductTag } from "@/services"
import { AddTagDialog } from "./AddTagDialog"

interface TagsPanelProps {
  productId: number
}

export default function TagsPanel({ productId }: TagsPanelProps) {
  const [tags, setTags] = useState<ProductTag[]>([])
  const [loading, setLoading] = useState(true)
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false)

  const fetchTags = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getProductTags(productId)
      if (res.code === 0) {
        setTags(res.data)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取标签失败")
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const handleRemoveTag = async (tagId: number) => {
    try {
      const res = await removeProductTag(productId, tagId)
      if (res.code === 0) {
        toast.success(res.message)
        await fetchTags()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除标签失败")
    }
  }

  const existingTagIds = tags.map((t) => t.id)

  return (
    <>
      <div className="flex items-center justify-between">
        <Button onClick={() => setAddTagDialogOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          新增标签
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          加载中...
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标签名称</TableHead>
              <TableHead className="w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                  暂无标签
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>{tag.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-500"
                      onClick={() => handleRemoveTag(tag.id)}
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
      )}

      <AddTagDialog
        open={addTagDialogOpen}
        onOpenChange={setAddTagDialogOpen}
        productId={productId}
        existingTagIds={existingTagIds}
        onAdded={fetchTags}
      />
    </>
  )
}
