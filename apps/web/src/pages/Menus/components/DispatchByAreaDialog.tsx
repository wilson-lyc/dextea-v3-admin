import { useState } from "react"
import { toast } from "sonner"

import type { AreaValue } from "@/components/area"
import { AreaSelector } from "@/components/area"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { dispatchMenuByArea } from "@/services"

interface DispatchByAreaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  menuId: number
  menuName: string
  onDispatched?: () => void
}

export default function DispatchByAreaDialog({
  open,
  onOpenChange,
  menuId,
  menuName,
  onDispatched,
}: DispatchByAreaDialogProps) {
  // 选中的省市区
  const [area, setArea] = useState<AreaValue>({ province: "", city: "", district: "" })
  // 是否处于确认步骤
  const [confirming, setConfirming] = useState(false)
  // 提交中
  const [submitting, setSubmitting] = useState(false)

  // 拼接地域显示文本
  const areaLabel = [area.province, area.city, area.district].filter(Boolean).join("")

  // 是否可以进入确认步骤（至少选了省）
  const canProceed = area.province.length > 0

  // 重置状态
  const reset = () => {
    setArea({ province: "", city: "", district: "" })
    setConfirming(false)
    setSubmitting(false)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset()
    onOpenChange(isOpen)
  }

  // 点击"下一步"进入确认
  const handleNext = () => {
    if (!canProceed) return
    setConfirming(true)
  }

  // 点击"上一步"返回选择
  const handleBack = () => {
    setConfirming(false)
  }

  // 最终确认分发
  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const res = await dispatchMenuByArea(menuId, {
        province: area.province,
        ...(area.city ? { city: area.city } : {}),
        ...(area.district ? { district: area.district } : {}),
      })
      if (res.code === 0) {
        toast.success(`已向「${areaLabel}」区域内的门店分发菜单`)
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
          <DialogTitle>按地域分发菜单</DialogTitle>
          <DialogDescription>
            {confirming
              ? "请确认分发信息"
              : "选择要分发的地域范围，至少选择省份。未选中的层级将分发该层级下所有门店。"}
          </DialogDescription>
        </DialogHeader>

        {confirming ? (
          // 确认步骤
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm leading-relaxed">
              将向「
              <span className="font-semibold text-foreground">{areaLabel}</span>
              」区域内的门店分发菜单「
              <span className="font-semibold text-foreground">{menuName}</span>
              」
            </p>
          </div>
        ) : (
          // 选择步骤
          <AreaSelector onChange={setArea} />
        )}

        <DialogFooter>
          {confirming ? (
            <>
              <Button variant="outline" onClick={handleBack} disabled={submitting}>
                上一步
              </Button>
              <Button onClick={handleConfirm} disabled={submitting}>
                {submitting ? "分发中..." : "确认分发"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                取消
              </Button>
              <Button onClick={handleNext} disabled={!canProceed}>
                下一步
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
