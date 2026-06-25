import { useEffect, useState } from "react"
import { PencilIcon } from "lucide-react"
import { toast } from "sonner"

import type { ProductCustomization, ProductCustomizationStatus } from "@dextea/shared-types"
import { PRODUCT_CUSTOMIZATION_STATUS } from "@dextea/shared-types"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const STATUS_LABEL: Record<number, string> = {
  [PRODUCT_CUSTOMIZATION_STATUS.OFF.value]: "下架",
  [PRODUCT_CUSTOMIZATION_STATUS.ON.value]: "启用",
}

export default function BasicInfoPanel({ item, onUpdated }: BasicInfoPanelProps) {
  const [basicDialogOpen, setBasicDialogOpen] = useState(false)
  const [name, setName] = useState(item.name)
  const [displayName, setDisplayName] = useState(item.displayName)
  const [submitting, setSubmitting] = useState(false)

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(String(item.status))
  const [statusSubmitting, setStatusSubmitting] = useState(false)

  useEffect(() => {
    if (basicDialogOpen) {
      setName(item.name)
      setDisplayName(item.displayName)
    }
  }, [basicDialogOpen, item])

  useEffect(() => {
    if (statusDialogOpen) {
      setSelectedStatus(String(item.status))
    }
  }, [statusDialogOpen, item])

  const handleSubmitBasic = async () => {
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
        setBasicDialogOpen(false)
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

  const handleSubmitStatus = async () => {
    setStatusSubmitting(true)
    try {
      const res = await updateProductCustomization(item.id, {
        name: item.name,
        displayName: item.displayName,
        status: Number(selectedStatus) as ProductCustomizationStatus,
      })
      if (res.code === 0) {
        toast.success(res.message)
        setStatusDialogOpen(false)
        onUpdated()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新状态失败")
    } finally {
      setStatusSubmitting(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>项目状态</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" onClick={() => setStatusDialogOpen(true)}>
                <PencilIcon data-icon="inline-start" />
                编辑
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">当前状态</span>
              <Badge
                className={
                  item.status === PRODUCT_CUSTOMIZATION_STATUS.OFF.value
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30"
                }
              >
                {STATUS_LABEL[item.status]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>基础信息</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" onClick={() => setBasicDialogOpen(true)}>
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

      <Dialog open={basicDialogOpen} onOpenChange={setBasicDialogOpen}>
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
            <Button variant="outline" onClick={() => setBasicDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitBasic} disabled={submitting}>
              {submitting ? "提交中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑项目状态</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field>
              <FieldLabel>
                项目状态 <span className="text-destructive">*</span>
              </FieldLabel>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择状态">
                    {STATUS_LABEL[Number(selectedStatus)]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PRODUCT_CUSTOMIZATION_STATUS).map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {STATUS_LABEL[opt.value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitStatus} disabled={statusSubmitting}>
              {statusSubmitting ? "提交中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
