import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { AreaSelector } from "@/components/ui/area-selector"
import type { AreaValue } from "@/components/ui/area-selector"
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
import { createStore, resolveMessage } from "@/api"

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

  const [nameError, setNameError] = useState("")
  const [accountError, setAccountError] = useState("")

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
      setNameError("")
      setAccountError("")
    }
  }, [open])

  const handleAreaChange = useCallback((value: AreaValue) => {
    setFormProvince(value.province)
    setFormCity(value.city)
    setFormDistrict(value.district)
  }, [])

  const handleSubmit = async () => {
    let hasError = false

    if (!formName) {
      setNameError("门店名称不能为空")
      hasError = true
    } else {
      setNameError("")
    }

    if (!formAccount) {
      setAccountError("登录账号不能为空")
      hasError = true
    } else {
      setAccountError("")
    }

    if (hasError) return

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
        toast.success(resolveMessage(res, "创建成功"))
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
            <DialogTitle>新增门店</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field data-invalid={!!nameError || undefined}>
              <FieldLabel htmlFor="store-name">
                门店名称
              </FieldLabel>
              <Input
                id="store-name"
                placeholder="请输入门店名称"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value)
                  if (nameError) setNameError("")
                }}
                aria-invalid={!!nameError || undefined}
              />
              {nameError && <FieldError>{nameError}</FieldError>}
            </Field>

            <Field data-invalid={!!accountError || undefined}>
              <FieldLabel htmlFor="store-account">
                登录账号
              </FieldLabel>
              <Input
                id="store-account"
                placeholder="请输入登录账号"
                value={formAccount}
                onChange={(e) => {
                  setFormAccount(e.target.value)
                  if (accountError) setAccountError("")
                }}
                aria-invalid={!!accountError || undefined}
              />
              {accountError && <FieldError>{accountError}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="store-email">邮箱</FieldLabel>
              <Input
                id="store-email"
                type="email"
                placeholder="请输入邮箱地址"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>
                省市区
              </FieldLabel>
              <AreaSelector key={open ? "open" : "closed"} onChange={handleAreaChange} />
            </Field>

            <Field>
              <FieldLabel htmlFor="store-address">
                地址
              </FieldLabel>
              <Input
                id="store-address"
                placeholder="请输入具体地址"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="store-phone">
                  联系电话
                </FieldLabel>
                <Input
                  id="store-phone"
                  placeholder="请输入联系电话"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="store-hours">
                  营业时间
                </FieldLabel>
                <Input
                  id="store-hours"
                  placeholder="例如：09:00-22:00"
                  value={formBusinessHours}
                  onChange={(e) => setFormBusinessHours(e.target.value)}
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

      {/* Initial Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>门店新增成功</DialogTitle>
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
