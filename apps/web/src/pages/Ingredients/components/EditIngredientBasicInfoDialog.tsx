import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { Ingredient } from "@/api"
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
import { updateIngredient } from "@/api"

interface EditIngredientBasicInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredient: Ingredient
  onUpdated: () => void
}

export function EditIngredientBasicInfoDialog({ open, onOpenChange, ingredient, onUpdated }: EditIngredientBasicInfoDialogProps) {
  const [name, setName] = useState(ingredient.name)
  const [unit, setUnit] = useState(ingredient.unit)
  const [submitting, setSubmitting] = useState(false)

  const [nameError, setNameError] = useState("")
  const [unitError, setUnitError] = useState("")

  useEffect(() => {
    if (open) {
      setName(ingredient.name)
      setUnit(ingredient.unit)
      setNameError("")
      setUnitError("")
    }
  }, [open, ingredient])

  const handleSubmit = async () => {
    let hasError = false

    if (!name.trim()) {
      setNameError("原料名称不能为空")
      hasError = true
    } else {
      setNameError("")
    }

    if (!unit.trim()) {
      setUnitError("单位不能为空")
      hasError = true
    } else {
      setUnitError("")
    }

    if (hasError) return

    setSubmitting(true)
    try {
      const res = await updateIngredient(ingredient.id, {
        name: name.trim(),
        unit: unit.trim(),
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

        <FieldGroup className="py-2">
          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor="edit-name">
              原料名称
            </FieldLabel>
            <Input
              id="edit-name"
              placeholder="请输入原料名称"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (nameError) setNameError("")
              }}
              aria-invalid={!!nameError || undefined}
            />
            {nameError && <FieldError>{nameError}</FieldError>}
          </Field>

          <Field data-invalid={!!unitError || undefined}>
            <FieldLabel htmlFor="edit-unit">
              单位
            </FieldLabel>
            <Input
              id="edit-unit"
              placeholder="如：克、毫升、个"
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value)
                if (unitError) setUnitError("")
              }}
              aria-invalid={!!unitError || undefined}
            />
            {unitError && <FieldError>{unitError}</FieldError>}
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
