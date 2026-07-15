import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { createRole } from "@/api"

interface CreateRoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export default function CreateRoleModal({ open, onOpenChange, onCreated }: CreateRoleModalProps) {
  const [formName, setFormName] = useState("")
  const [formNote, setFormNote] = useState("")
  const [nameError, setNameError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setFormName("")
    setFormNote("")
    setNameError("")
    setSubmitting(false)
  }

  const handleSubmit = async () => {
    if (!formName.trim()) {
      setNameError("角色名称不能为空")
      return
    }
    setNameError("")

    setSubmitting(true)
    try {
      const res = await createRole({ name: formName.trim(), note: formNote.trim() || undefined })
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
        resetForm()
        onCreated()
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
          <DialogTitle>创建角色</DialogTitle>
          <DialogDescription>创建后可为角色分配权限，并绑定到员工</DialogDescription>
        </DialogHeader>

        <FieldGroup className="py-2">
          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor="create-role-name">角色名称</FieldLabel>
            <Input
              id="create-role-name"
              placeholder="请输入角色名称"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value)
                if (nameError) setNameError("")
              }}
              aria-invalid={!!nameError || undefined}
            />
            {nameError && <FieldError>{nameError}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="create-role-note">备注</FieldLabel>
            <Textarea
              id="create-role-note"
              placeholder="请输入角色备注（选填）"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
            />
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
