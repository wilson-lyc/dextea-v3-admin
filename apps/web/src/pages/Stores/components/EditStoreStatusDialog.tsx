import { useEffect, useState } from "react"
import { toast } from "sonner"

import { STORE_STATUS, type StoreStatus } from "@/lib/status"
import { STORE_STATUS_LABEL } from "@/lib/status"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { StatusSelectPicker } from "@/components/ui/status-select-picker"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { updateStoreStatus } from "@/api"

interface EditStoreStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeId: number
  currentStatus: StoreStatus
  onUpdated: () => void
}

export function EditStoreStatusDialog({ open, onOpenChange, storeId, currentStatus, onUpdated }: EditStoreStatusDialogProps) {
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
      const res = await updateStoreStatus(storeId, { status: Number(selected) as StoreStatus })
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
        onUpdated()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("更新门店状态失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑门店状态</DialogTitle>
        </DialogHeader>

        <FieldGroup className="py-2">
          <Field>
            <FieldLabel>
              门店状态
            </FieldLabel>
            <StatusSelectPicker
              statusEnum={STORE_STATUS}
              labels={STORE_STATUS_LABEL}
              value={selected}
              onValueChange={setSelected}
              placeholder="请选择门店状态"
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
