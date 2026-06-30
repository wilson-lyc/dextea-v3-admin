import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { Menu } from "@dextea/shared-types"
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
import { updateMenu } from "@/services"

interface EditBasicInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  menuId: number
  menu: Menu
  onUpdated: () => void
}

export default function EditBasicInfoDialog({ open, onOpenChange, menuId, menu, onUpdated }: EditBasicInfoDialogProps) {
  const [name, setName] = useState(menu.name)
  const [description, setDescription] = useState(menu.description)
  const [submitting, setSubmitting] = useState(false)
  const [nameError, setNameError] = useState("")

  useEffect(() => {
    if (open) {
      setName(menu.name)
      setDescription(menu.description)
      setNameError("")
    }
  }, [open, menu])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError("菜单名称不能为空")
      return
    }
    setNameError("")

    setSubmitting(true)
    try {
      const res = await updateMenu(menuId, {
        name: name.trim(),
        description: description.trim(),
      })
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
        onUpdated()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新信息失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑基础信息</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor="edit-name">
              菜单名称 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="edit-name"
              placeholder="请输入菜单名称"
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
            <FieldLabel htmlFor="edit-description">描述</FieldLabel>
            <Textarea
              id="edit-description"
              placeholder="请输入菜单描述"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
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
