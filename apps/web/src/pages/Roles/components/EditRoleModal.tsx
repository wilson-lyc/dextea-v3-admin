import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { Role } from "@/api"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { updateRole } from "@/api"

interface EditRoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onUpdated: () => void
}

export default function EditRoleModal({ open, onOpenChange, role, onUpdated }: EditRoleModalProps) {
  const [formName, setFormName] = useState("")
  const [formNote, setFormNote] = useState("")
  const [nameError, setNameError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && role) {
      setFormName(role.name)
      setFormNote(role.note ?? "")
      setNameError("")
    }
  }, [open, role])

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
    if (!role) return

    setSubmitting(true)
    try {
      const res = await updateRole(role.id, { name: formName.trim(), note: formNote.trim() || undefined })
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
          <DialogTitle>编辑角色</DialogTitle>
        </DialogHeader>

        <FieldGroup className="py-2">
          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor="edit-role-name">角色名称</FieldLabel>
            <Input
              id="edit-role-name"
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
            <FieldLabel htmlFor="edit-role-note">备注</FieldLabel>
            <Textarea
              id="edit-role-note"
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
