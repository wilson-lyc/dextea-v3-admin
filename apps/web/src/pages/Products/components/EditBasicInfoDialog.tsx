import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { Product } from "@/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { updateProduct } from "@/api"
import { logger, extractBackendMessage } from "@/lib/logger"

interface EditBasicInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: number
  product: Product
  onUpdated: () => void
}

export function EditBasicInfoDialog({ open, onOpenChange, productId, product, onUpdated }: EditBasicInfoDialogProps) {
  const [name, setName] = useState(product.name)
  const [brief, setBrief] = useState(product.brief)
  const [description, setDescription] = useState(product.description)
  const [price, setPrice] = useState(String(product.price))
  const [submitting, setSubmitting] = useState(false)

  const [nameError, setNameError] = useState("")

  useEffect(() => {
    if (open) {
      setName(product.name)
      setBrief(product.brief)
      setDescription(product.description)
      setPrice(String(product.price))
      setNameError("")
    }
  }, [open, product])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError("商品名称不能为空")
      return
    }
    setNameError("")

    const priceNum = Number(price)
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("请输入有效的价格")
      return
    }

    setSubmitting(true)
    try {
      const res = await updateProduct(productId, {
        name: name.trim(),
        brief: brief.trim(),
        description: description.trim(),
        price: priceNum,
      })
      if (res.code === 0) {
        toast.success(res.message || "更新商品成功")
        onOpenChange(false)
        onUpdated()
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "更新商品基础信息",
      })
      toast.error("更新商品失败，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑商品基础信息</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-[3px]">
        <FieldGroup>
          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor="edit-name">
              商品名称
            </FieldLabel>
            <Input
              id="edit-name"
              placeholder="请输入商品名称"
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
            <FieldLabel htmlFor="edit-brief">
               菜单页简介
            </FieldLabel>
            <Textarea
              id="edit-brief"
              placeholder="请输入菜单页简介，至多100字"
              value={brief}
              onChange={(e) => {
                if (e.target.value.length <= 100) setBrief(e.target.value)
              }}
              rows={3}
            />
            <span className="text-xs text-muted-foreground text-right block">{brief.length}/100</span>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-description">
               商详页介绍
            </FieldLabel>
            <Textarea
              id="edit-description"
              placeholder="请输入商详页介绍，至多500字"
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 500) setDescription(e.target.value)
              }}
              rows={4}
            />
            <span className="text-xs text-muted-foreground text-right block">{description.length}/500</span>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-price">
               价格
            </FieldLabel>
            <Input
              id="edit-price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="请输入价格"
            />
          </Field>
        </FieldGroup>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "处理中..." : "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
