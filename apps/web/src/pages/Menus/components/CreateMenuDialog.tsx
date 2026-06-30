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
  DialogFooter,
} from "@/components/ui/dialog"
import { createMenu } from "@/services"

interface CreateMenuDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function CreateMenuDialog({ open, onOpenChange, onSuccess }: CreateMenuDialogProps) {
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [nameError, setNameError] = useState("")

  const handleSubmit = async () => {
    if (!formName) {
      setNameError("菜单名称不能为空")
      return
    }
    setNameError("")

    setSubmitting(true)
    try {
      const res = await createMenu({ name: formName, description: formDescription })
      if (res.code === 0) {
        toast.success(res.message)
        setFormName("")
        setFormDescription("")
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败")
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (submitting) return
    setFormName("")
    setFormDescription("")
    setNameError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建菜单</DialogTitle>
        </DialogHeader>

        <FieldGroup className="py-2">
          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor="menu-name">
              菜单名称 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="menu-name"
              placeholder="请输入菜单名称"
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
            <FieldLabel htmlFor="menu-description">描述</FieldLabel>
            <Textarea
              id="menu-description"
              placeholder="请输入菜单描述"
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
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
