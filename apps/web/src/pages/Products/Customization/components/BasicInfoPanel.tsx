import { useEffect, useState } from "react"
import { PencilIcon } from "lucide-react"
import { toast } from "sonner"

import type { ProductCustomization } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card"
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
import { updateProductCustomization } from "@/services"

interface BasicInfoPanelProps {
  item: ProductCustomization
  onUpdated: () => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function BasicInfoPanel({ item, onUpdated }: BasicInfoPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState(item.name)
  const [displayName, setDisplayName] = useState(item.displayName)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (dialogOpen) {
      setName(item.name)
      setDisplayName(item.displayName)
    }
  }, [dialogOpen, item])

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
      const res = await updateProductCustomization(item.id, {
        name: name.trim(),
        displayName: displayName.trim(),
      })
      if (res.code === 0) {
        toast.success(res.message)
        setDialogOpen(false)
        onUpdated()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>基础信息</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
                <PencilIcon data-icon="inline-start" />
                编辑
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
              <span className="text-sm text-muted-foreground">项目 ID</span>
              <span className="text-sm font-mono">{item.id}</span>

              <span className="text-sm text-muted-foreground">名称</span>
              <span className="text-sm">{item.name}</span>

              <span className="text-sm text-muted-foreground">展示名称</span>
              <span className="text-sm">{item.displayName || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>维护记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
              <span className="text-sm text-muted-foreground">创建时间</span>
              <span className="text-sm">{formatDate(item.createdAt)}</span>

              <span className="text-sm text-muted-foreground">更新时间</span>
              <span className="text-sm">{formatDate(item.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑基础信息</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field>
              <FieldLabel htmlFor="edit-name">
                名称 <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="edit-name"
                placeholder="例如：冰量、甜度"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-display-name">
                展示名称 <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="edit-display-name"
                placeholder="展示给顾客端的名称"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "提交中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
