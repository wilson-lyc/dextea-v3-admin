import { useEffect, useState } from "react"

import type { Store } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface EditBasicInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: Store
}

export function EditBasicInfoDialog({ open, onOpenChange, store }: EditBasicInfoDialogProps) {
  const [name, setName] = useState(store.name)
  const [phone, setPhone] = useState(store.phone)
  const [businessHours, setBusinessHours] = useState(store.businessHours)

  useEffect(() => {
    if (open) {
      setName(store.name)
      setPhone(store.phone)
      setBusinessHours(store.businessHours)
    }
  }, [open, store])

  const handleSubmit = () => {
    // TODO: 调用 updateStore API
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑基础信息</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-store-name">
              门店名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-store-name"
              placeholder="请输入门店名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-store-phone">联系电话</Label>
              <Input
                id="edit-store-phone"
                placeholder="请输入联系电话"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-store-hours">营业时间</Label>
              <Input
                id="edit-store-hours"
                placeholder="例如：09:00-22:00"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
