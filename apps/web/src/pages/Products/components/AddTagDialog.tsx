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

interface AddTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: number
  existingTagIds: number[]
  onAdded: () => void
}

export function AddTagDialog({ open, onOpenChange, productId, existingTagIds, onAdded }: AddTagDialogProps) {
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
      toast.error(err instanceof Error ? err.message : "获取标签列表失败")
    }
  }

  const availableTags = allTags.filter((t) => !existingTagIds.includes(t.id))

  const selectedLabel = selectedTagId
    ? allTags.find((t) => String(t.id) === selectedTagId)?.name
    : undefined

  const handleSubmit = async () => {
    if (!selectedTagId) return
    setSubmitting(true)
    try {
      const res = await addProductTag(productId, Number(selectedTagId))
      if (res.code === 0) {
        toast.success("绑定成功")
        onOpenChange(false)
        onAdded()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "绑定标签失败")
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
                {availableTags.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    暂无可绑定的标签
                  </div>
                ) : (
                  availableTags.map((t) => (
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
