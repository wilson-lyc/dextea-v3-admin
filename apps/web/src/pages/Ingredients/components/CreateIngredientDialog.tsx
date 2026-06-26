import { useEffect, useState } from "react"
import { toast } from "sonner"

import { INGREDIENT_STATUS } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { createIngredient } from "@/services"

interface CreateIngredientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateIngredientDialog({ open, onOpenChange, onCreated }: CreateIngredientDialogProps) {
  const [formName, setFormName] = useState("")
  const [formUnit, setFormUnit] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [nameError, setNameError] = useState("")
  const [unitError, setUnitError] = useState("")

  useEffect(() => {
    if (!open) {
      setFormName("")
      setFormUnit("")
      setNameError("")
      setUnitError("")
    }
  }, [open])

  const handleSubmit = async () => {
    let hasError = false

    if (!formName) {
      setNameError("原料名称不能为空")
      hasError = true
    } else {
      setNameError("")
    }

    if (!formUnit) {
      setUnitError("单位不能为空")
      hasError = true
    } else {
      setUnitError("")
    }

    if (hasError) return

    setSubmitting(true)
    try {
      const res = await createIngredient({
        name: formName,
        unit: formUnit,
        status: INGREDIENT_STATUS.OFF.value,
      })
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增原料</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-[5px]">
        <FieldGroup className="py-2">
          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor="ingredient-name">
              名称 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="ingredient-name"
              placeholder="请输入原料名称"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value)
                if (nameError) setNameError("")
              }}
              aria-invalid={!!nameError || undefined}
            />
            {nameError && <FieldError>{nameError}</FieldError>}
          </Field>

          <Field data-invalid={!!unitError || undefined}>
            <FieldLabel htmlFor="ingredient-unit">
              单位 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="ingredient-unit"
              placeholder="如：克、毫升、个"
              value={formUnit}
              onChange={(e) => {
                setFormUnit(e.target.value)
                if (unitError) setUnitError("")
              }}
              aria-invalid={!!unitError || undefined}
            />
            {unitError && <FieldError>{unitError}</FieldError>}
          </Field>
        </FieldGroup>
        </ScrollArea>

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
