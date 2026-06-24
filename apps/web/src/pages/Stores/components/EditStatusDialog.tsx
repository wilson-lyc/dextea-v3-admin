import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { StoreStatus } from "@dextea/shared-types"
import { STORE_STATUS, STORE_STATUS_LABEL } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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

const STATUS_OPTIONS: { value: StoreStatus; label: string }[] = [
  { value: STORE_STATUS.OPEN, label: STORE_STATUS_LABEL[STORE_STATUS.OPEN] },
  { value: STORE_STATUS.RESTING, label: STORE_STATUS_LABEL[STORE_STATUS.RESTING] },
  { value: STORE_STATUS.PREPARING, label: STORE_STATUS_LABEL[STORE_STATUS.PREPARING] },
  { value: STORE_STATUS.CLOSED, label: STORE_STATUS_LABEL[STORE_STATUS.CLOSED] },
]

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

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label>
              门店状态 <span className="text-destructive">*</span>
            </Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择门店状态">
                  {STORE_STATUS_LABEL[Number(selected) as StoreStatus]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
