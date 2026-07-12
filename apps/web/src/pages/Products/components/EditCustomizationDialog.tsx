import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { updateCustomization } from "@/api"

interface EditCustomizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: { id: number; name: string; sort: number }
  onUpdated: () => void
}

export function EditCustomizationDialog({ open, onOpenChange, item, onUpdated }: EditCustomizationDialogProps) {
  const [name, setName] = useState(item.name)
  const [sort, setSort] = useState(String(item.sort))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(item.name)
      setSort(String(item.sort))
    }
  }, [open, item])

  const handleUpdate = async () => {
    if (!name.trim()) {
      toast.error("请输入项目名称")
      return
    }
    setSaving(true)
    try {
      const res = await updateCustomization(item.id, {
        name: name.trim(),
        sort: Number(sort),
      })
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
        onUpdated()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑客制化项目</DialogTitle>
        </DialogHeader>

        <FieldGroup className="py-2">
          <Field>
            <FieldLabel htmlFor="edit-name">
              项目名称
            </FieldLabel>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdate()
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-sort">排序序号</FieldLabel>
            <Input
              id="edit-sort"
              type="number"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdate()
              }}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">取消</Button>} />
          <Button onClick={handleUpdate} disabled={saving}>
            {saving ? "保存中..." : "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
