import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { Store } from "@/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
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
import { updateStoreBasicInfo } from "@/api"

interface EditStoreBasicInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: Store
  onUpdated: () => void
}

export function EditStoreBasicInfoDialog({ open, onOpenChange, store, onUpdated }: EditStoreBasicInfoDialogProps) {
  const [name, setName] = useState(store.name)
  const [phone, setPhone] = useState(store.phone)
  const [businessHours, setBusinessHours] = useState(store.businessHours)
  const [email, setEmail] = useState(store.email)
  const [submitting, setSubmitting] = useState(false)

  const [nameError, setNameError] = useState("")

  useEffect(() => {
    if (open) {
      setName(store.name)
      setPhone(store.phone)
      setBusinessHours(store.businessHours)
      setEmail(store.email)
      setNameError("")
    }
  }, [open, store])

  const handleSubmit = async () => {
    if (!name) {
      setNameError("门店名称不能为空")
      return
    }
    setNameError("")

    setSubmitting(true)
    try {
      const res = await updateStoreBasicInfo(store.id, { name, phone, businessHours, email })
      if (res.code === 0) {
        toast.success("基础信息更新成功")
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

        <FieldGroup className="py-2">
          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor="edit-store-name">
              门店名称
            </FieldLabel>
            <Input
              id="edit-store-name"
              placeholder="请输入门店名称"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (nameError) setNameError("")
              }}
              aria-invalid={!!nameError || undefined}
            />
            {nameError && <FieldError>{nameError}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-store-email">邮箱</FieldLabel>
            <Input
              id="edit-store-email"
              type="email"
              placeholder="请输入邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="edit-store-phone">
                联系电话
              </FieldLabel>
              <Input
                id="edit-store-phone"
                placeholder="请输入联系电话"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-store-hours">
                营业时间
              </FieldLabel>
              <Input
                id="edit-store-hours"
                placeholder="例如：09:00-22:00"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
              />
            </Field>
          </div>
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
