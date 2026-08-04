import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { ProductTag } from "@/api"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { getTags, addProductTag } from "@/api"
import { logger, extractBackendMessage } from "@/lib/logger"

interface AddTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: number
  onAdded: () => void
}

export function AddTagDialog({ open, onOpenChange, productId, onAdded }: AddTagDialogProps) {
  const [allTags, setAllTags] = useState<ProductTag[]>([])
  const [selectedTagId, setSelectedTagId] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedTagId("")
      fetchTags()
    }
  }, [open])

  const fetchTags = async () => {
    try {
      const res = await getTags()
      setAllTags(res.data.items)
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "获取标签列表",
      })
      toast.error("数据加载异常，请稍后重试")
    }
  }

  const selectedLabel = selectedTagId
    ? allTags.find((t) => String(t.id) === selectedTagId)?.name
    : undefined

  const handleSubmit = async () => {
    if (!selectedTagId) return
    setSubmitting(true)
    try {
      const res = await addProductTag(productId, Number(selectedTagId))
      if (res.code === 0) {
        toast.success(res.message || "绑定标签成功")
        onOpenChange(false)
        onAdded()
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "绑定商品标签",
      })
      toast.error("绑定标签失败，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>绑定标签</DialogTitle>
        </DialogHeader>

        <FieldGroup className="py-2">
          <Field>
            <FieldLabel htmlFor="add-tag">选择标签</FieldLabel>
            <Select value={selectedTagId} onValueChange={(v) => setSelectedTagId(v ?? "")}>
              <SelectTrigger className="w-full" id="add-tag">
                <SelectValue placeholder="请选择标签">{selectedLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {allTags.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    暂无标签
                  </div>
                ) : (
                  allTags.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedTagId}>
            {submitting ? "提交中..." : "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
