import { useEffect, useState } from "react"
import { toast } from "sonner"

import { PRODUCT_STATUS, type ProductStatus } from "@dextea-admin/contracts/status"
import { Button } from "@/components/ui/button"
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
import { StatusSelectPicker } from "@/components/ui/status-select-picker"
import { toggleProductStatus } from "@/api"

interface EditStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: number
  currentStatus: ProductStatus
  onUpdated: () => void
}

export function EditStatusDialog({ open, onOpenChange, productId, currentStatus, onUpdated }: EditStatusDialogProps) {
  const [selected, setSelected] = useState<string>(String(currentStatus))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setSelected(String(currentStatus))
    }
  }, [open, currentStatus])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await toggleProductStatus(productId, Number(selected) as ProductStatus)
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
        onUpdated()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新状态失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑商品全局状态</DialogTitle>
        </DialogHeader>

        <FieldGroup className="py-2">
          <Field>
            <FieldLabel>状态</FieldLabel>
            <StatusSelectPicker
              statusEnum={PRODUCT_STATUS}
              labels={{ [PRODUCT_STATUS.OFF.value]: "下架", [PRODUCT_STATUS.ON.value]: "可售" }}
              value={selected}
              onValueChange={setSelected}
              placeholder="请选择状态"
              className="w-full"
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "提交中..." : "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
