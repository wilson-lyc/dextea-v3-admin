import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { Employee } from "@/api"
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
import { updateEmployee } from "@/api"

interface EditEmployeeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  onUpdated: () => void
}

export default function EditEmployeeModal({ open, onOpenChange, employee, onUpdated }: EditEmployeeModalProps) {
  const [formEmail, setFormEmail] = useState("")
  const [formDisplayName, setFormDisplayName] = useState("")
  const [emailError, setEmailError] = useState("")
  const [nameError, setNameError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Sync form state from employee when dialog opens
  useEffect(() => {
    if (open && employee) {
      setFormEmail(employee.email)
      setFormDisplayName(employee.displayName)
      setEmailError("")
      setNameError("")
    }
  }, [open, employee])

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

    if (hasError || !employee) return

    setSubmitting(true)
    try {
      const res = await updateEmployee(employee.id, { email: formEmail, displayName: formDisplayName })
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
        resetForm()
        onUpdated()
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
          <DialogTitle>编辑员工</DialogTitle>
        </DialogHeader>

        <FieldGroup className="py-2">
          {/* Email */}
          <Field data-invalid={!!emailError || undefined}>
            <FieldLabel htmlFor="edit-email">
              邮箱
            </FieldLabel>
            <Input
              id="edit-email"
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

          {/* DisplayName */}
          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor="edit-display-name">
              用户名
            </FieldLabel>
            <Input
              id="edit-display-name"
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
