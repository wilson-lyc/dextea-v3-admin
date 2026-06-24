import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { AreaSelector } from "@/components/area"
import type { AreaValue } from "@/components/area"
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
import { createStore } from "@/services"

interface CreateStoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateStoreDialog({ open, onOpenChange, onCreated }: CreateStoreDialogProps) {
  const [formName, setFormName] = useState("")
  const [formProvince, setFormProvince] = useState("")
  const [formCity, setFormCity] = useState("")
  const [formDistrict, setFormDistrict] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formBusinessHours, setFormBusinessHours] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formAccount, setFormAccount] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Password display state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [initialPassword, setInitialPassword] = useState("")

  useEffect(() => {
    if (!open) {
      setFormName("")
      setFormProvince("")
      setFormCity("")
      setFormDistrict("")
      setFormAddress("")
      setFormBusinessHours("")
      setFormPhone("")
      setFormAccount("")
      setFormEmail("")
    }
  }, [open])

  const handleAreaChange = useCallback((value: AreaValue) => {
    setFormProvince(value.province)
    setFormCity(value.city)
    setFormDistrict(value.district)
  }, [])

  const handleSubmit = async () => {
    if (!formName) {
      toast.error("门店名称不能为空")
      return
    }
    if (!formAccount) {
      toast.error("登录账号不能为空")
      return
    }

    setSubmitting(true)
    try {
      const res = await createStore({
        name: formName,
        province: formProvince,
        city: formCity,
        district: formDistrict,
        address: formAddress,
        businessHours: formBusinessHours,
        phone: formPhone,
        account: formAccount,
        email: formEmail,
      })
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
        setInitialPassword(res.data.initialPassword)
        setPasswordDialogOpen(true)
        onCreated()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>创建门店</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="store-name">
                门店名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="store-name"
                placeholder="请输入门店名称"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="store-account">
                登录账号 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="store-account"
                placeholder="请输入登录账号（全局唯一）"
                value={formAccount}
                onChange={(e) => setFormAccount(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="store-email">
                邮箱
              </Label>
              <Input
                id="store-email"
                type="email"
                placeholder="请输入邮箱地址"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>省市区 <span className="text-destructive">*</span></Label>
              <AreaSelector key={open} onChange={handleAreaChange} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="store-address">
                具体地址 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="store-address"
                placeholder="请输入具体地址"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="store-phone">
                  联系电话 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="store-phone"
                  placeholder="请输入联系电话"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="store-hours">
                  营业时间 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="store-hours"
                  placeholder="例如：09:00-22:00"
                  value={formBusinessHours}
                  onChange={(e) => setFormBusinessHours(e.target.value)}
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

      {/* Initial Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>门店创建成功</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-4">
            <div className="rounded-lg border bg-muted px-6 py-3 font-mono text-lg tracking-widest">
              {initialPassword}
            </div>
            <p className="text-xs text-destructive font-medium">
              此密码仅显示一次，关闭后将不再显示
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => setPasswordDialogOpen(false)}>
              我已保存，关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
