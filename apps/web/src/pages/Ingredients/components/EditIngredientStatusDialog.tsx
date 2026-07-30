import { useEffect, useState } from "react"
import { toast } from "sonner"

import { INGREDIENT_STATUS, type IngredientStatus } from "@dextea-admin/contracts/status"
import { Button } from "@/components/ui/button"
import {
  Field,
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
import { StatusSelectPicker } from "@/components/ui/status-select-picker"
import { toggleIngredientStatus } from "@/api"

interface EditIngredientStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredientId: number
  currentStatus: IngredientStatus
  onUpdated: () => void
}

export function EditIngredientStatusDialog({ open, onOpenChange, ingredientId, currentStatus, onUpdated }: EditIngredientStatusDialogProps) {
  const [selected, setSelected] = useState<string>(String(currentStatus))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setSelected(String(currentStatus))
    }
  }, [open, currentStatus])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await toggleIngredientStatus(ingredientId, Number(selected) as IngredientStatus)
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
        onUpdated()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新状态失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑原料状态</DialogTitle>
        </DialogHeader>

        <FieldGroup className="py-2">
          <Field>
            <FieldLabel>状态</FieldLabel>
            <StatusSelectPicker
              statusEnum={INGREDIENT_STATUS}
              labels={{ [INGREDIENT_STATUS.ACTIVE.value]: "禁用", [INGREDIENT_STATUS.DISABLED.value]: "激活" }}
              value={selected}
              onValueChange={setSelected}
              placeholder="请选择状态"
              className="w-full"
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
