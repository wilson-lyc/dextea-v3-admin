import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { createProductCustomization } from "@/services"

interface CreateCustomizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateCustomizationDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateCustomizationDialogProps) {
  const [name, setName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("请输入名称")
      return
    }
    if (!displayName.trim()) {
      toast.error("请输入展示名称")
      return
    }

    setSubmitting(true)
    try {
      const res = await createProductCustomization({
        name: name.trim(),
        displayName: displayName.trim(),
      })
      if (res.code === 0) {
        toast.success(res.message)
        setName("")
        setDisplayName("")
        onCreated()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建客制化项目</DialogTitle>
        </DialogHeader>

        <FieldGroup className="py-2">
          <Field>
            <FieldLabel htmlFor="customization-name">
              名称 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="customization-name"
              placeholder="例如：冰量、甜度"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
              }}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="customization-display-name">
              展示名称 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="customization-display-name"
              placeholder="展示给顾客端的名称"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
              }}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "创建中..." : "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
