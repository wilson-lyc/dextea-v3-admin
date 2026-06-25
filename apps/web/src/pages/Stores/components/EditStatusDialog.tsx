import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { StoreStatus } from "@dextea/shared-types"
import { STORE_STATUS } from "@dextea/shared-types"
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
import { updateStoreStatus } from "@/services"

interface EditStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storeId: number
  currentStatus: StoreStatus
  onUpdated: () => void
}

export function EditStatusDialog({ open, onOpenChange, storeId, currentStatus, onUpdated }: EditStatusDialogProps) {
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
              门店状态 <span className="text-destructive">*</span>
            </FieldLabel>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择门店状态">
                  {({
                    [STORE_STATUS.RESTING.value]: '休息中',
                    [STORE_STATUS.OPEN.value]: '营业中',
                    [STORE_STATUS.PREPARING.value]: '筹备中',
                    [STORE_STATUS.CLOSED.value]: '已注销',
                  } as Record<number, string>)[Number(selected)]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.values(STORE_STATUS).map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {({
                      [STORE_STATUS.RESTING.value]: '休息中',
                      [STORE_STATUS.OPEN.value]: '营业中',
                      [STORE_STATUS.PREPARING.value]: '筹备中',
                      [STORE_STATUS.CLOSED.value]: '已注销',
                    } as Record<number, string>)[opt.value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
