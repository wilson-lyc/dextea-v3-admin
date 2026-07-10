import { useState } from "react"
import { toast } from "sonner"

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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { createEmployee } from "@/api"

interface CreateEmployeeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (initialPassword: string) => void
}

export default function CreateEmployeeModal({ open, onOpenChange, onCreated }: CreateEmployeeModalProps) {
  const [formEmail, setFormEmail] = useState("")
  const [formDisplayName, setFormDisplayName] = useState("")
  const [emailError, setEmailError] = useState("")
  const [nameError, setNameError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setFormEmail("")
    setFormDisplayName("")
    setEmailError("")
    setNameError("")
    setSubmitting(false)
  }

  const handleSubmit = async () => {
    let hasError = false

    if (!formEmail) {
      setEmailError("邮箱不能为空")
      hasError = true
    } else {
      setEmailError("")
    }

    if (!formDisplayName) {
      setNameError("用户名不能为空")
      hasError = true
    } else {
      setNameError("")
    }

    if (hasError) return

    setSubmitting(true)
    try {
      const res = await createEmployee({ email: formEmail, displayName: formDisplayName })
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
        resetForm()
        onCreated(res.data.initialPassword)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "系统异常，稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm()
        onOpenChange(val)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建员工</DialogTitle>
          <DialogDescription>
            填写新员工的信息，创建后系统将自动生成初始密码
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="py-2">
          <Field data-invalid={!!emailError || undefined}>
            <FieldLabel htmlFor="create-email">
              邮箱
            </FieldLabel>
            <Input
              id="create-email"
              type="email"
              placeholder="请输入邮箱地址"
              value={formEmail}
              onChange={(e) => {
                setFormEmail(e.target.value)
                if (emailError) setEmailError("")
              }}
              aria-invalid={!!emailError || undefined}
            />
            {emailError && <FieldError>{emailError}</FieldError>}
          </Field>

          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor="create-display-name">
              用户名
            </FieldLabel>
            <Input
              id="create-display-name"
              placeholder="请输入用户名"
              value={formDisplayName}
              onChange={(e) => {
                setFormDisplayName(e.target.value)
                if (nameError) setNameError("")
              }}
              aria-invalid={!!nameError || undefined}
            />
            {nameError && <FieldError>{nameError}</FieldError>}
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false) }}>
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
