import { useEffect, useState } from "react"
import { toast } from "sonner"

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
import { updateStoreBasicInfo } from "@/services"

interface EditBasicInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: Store
  onUpdated: () => void
}

export function EditBasicInfoDialog({ open, onOpenChange, store, onUpdated }: EditBasicInfoDialogProps) {
  const [name, setName] = useState(store.name)
  const [phone, setPhone] = useState(store.phone)
  const [businessHours, setBusinessHours] = useState(store.businessHours)
  const [email, setEmail] = useState(store.email)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(store.name)
      setPhone(store.phone)
      setBusinessHours(store.businessHours)
      setEmail(store.email)
    }
  }, [open, store])

  const handleSubmit = async () => {
    if (!name) {
      toast.error("门店名称不能为空")
      return
    }

    setSubmitting(true)
    try {
      const res = await updateStoreBasicInfo(store.id, { name, phone, businessHours, email })
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
        onUpdated()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("更新门店基础信息失败")
    } finally {
      setSubmitting(false)
    }
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-store-email">
              邮箱
            </Label>
            <Input
              id="edit-store-email"
              type="email"
              placeholder="请输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-store-phone">
                联系电话 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-store-phone"
                placeholder="请输入联系电话"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-store-hours">
                营业时间 <span className="text-destructive">*</span>
              </Label>
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
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "提交中..." : "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
