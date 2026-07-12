import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { dispatchMenuById } from "@/api"

interface DispatchByIdDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  menuId: number
  menuName: string
  onDispatched?: () => void
}

export default function DispatchByIdDialog({
  open,
  onOpenChange,
  menuId,
  onDispatched,
}: DispatchByIdDialogProps) {
  const [input, setInput] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // 解析输入的ID列表（一行一个ID）
  const parseStoreIds = (text: string): number[] => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => Number(line))
      .filter((id) => Number.isInteger(id) && id > 0)
  }

  const storeIds = parseStoreIds(input)
  const canSubmit = storeIds.length > 0

  const reset = () => {
    setInput("")
    setSubmitting(false)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset()
    onOpenChange(isOpen)
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const res = await dispatchMenuById(menuId, { storeIds })
      if (res.code === 0) {
        toast.success(`共匹配 ${res.data.matched} 家门店，成功分发 ${res.data.dispatched} 家`)
        handleClose(false)
        onDispatched?.()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>按ID分发菜单</DialogTitle>
          <DialogDescription>
            输入门店ID，一行一个。已绑定的门店将自动跳过。
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="py-2">
          <Field>
            <FieldLabel htmlFor="store-ids-input">
              门店ID <span className="text-destructive">*</span>
            </FieldLabel>
            <Textarea
              id="store-ids-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={8}
              className="font-mono"
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "分发中..." : "确认分发"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
