import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { ProductStatus } from "@dextea-admin/contracts/status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { createProduct } from "@/api"
import { logger, extractBackendMessage } from "@/lib/logger"

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateProductDialog({ open, onOpenChange, onCreated }: CreateProductDialogProps) {
  const [formName, setFormName] = useState("")
  const [formBrief, setFormBrief] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [nameError, setNameError] = useState("")
  const [priceError, setPriceError] = useState("")

  useEffect(() => {
    if (!open) {
      setFormName("")
      setFormBrief("")
      setFormDescription("")
      setFormPrice("")
      setNameError("")
      setPriceError("")
    }
  }, [open])

  const handleSubmit = async () => {
    let hasError = false

    if (!formName) {
      setNameError("商品名称不能为空")
      hasError = true
    } else {
      setNameError("")
    }

    const price = parseFloat(formPrice)
    if (formPrice !== "" && (isNaN(price) || price < 0)) {
      setPriceError("商品价格无效")
      hasError = true
    } else {
      setPriceError("")
    }

    if (hasError) return

    setSubmitting(true)
    try {
      const res = await createProduct({
        name: formName,
        brief: formBrief,
        description: formDescription,
        price: formPrice !== "" ? price : 0,
        status: 0 as ProductStatus,
      })
      if (res.code === 0) {
        toast.success(res.message || "创建商品成功")
        onOpenChange(false)
        onCreated()
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "创建商品",
      })
      toast.error("创建商品失败，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新增商品</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-[5px]">
        <FieldGroup className="py-2">
          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor="product-name">
               商品名称
            </FieldLabel>
            <Input
              id="product-name"
              placeholder="请输入商品名称"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value)
                if (nameError) setNameError("")
              }}
              aria-invalid={!!nameError || undefined}
            />
            {nameError && <FieldError>{nameError}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="product-brief">
               菜单页简介
            </FieldLabel>
            <Textarea
              id="product-brief"
              placeholder="请输入菜单页简介，至多100字"
              value={formBrief}
              onChange={(e) => {
                if (e.target.value.length <= 100) setFormBrief(e.target.value)
              }}
              rows={2}
            />
            <span className="text-xs text-muted-foreground text-right block">{formBrief.length}/100</span>
          </Field>

          <Field>
            <FieldLabel htmlFor="product-description">
               商详页介绍
            </FieldLabel>
            <Textarea
              id="product-description"
              placeholder="请输入商详页介绍，至多500字"
              value={formDescription}
              onChange={(e) => {
                if (e.target.value.length <= 500) setFormDescription(e.target.value)
              }}
              rows={3}
            />
            <span className="text-xs text-muted-foreground text-right block">{formDescription.length}/500</span>
          </Field>

          <Field data-invalid={!!priceError || undefined}>
            <FieldLabel htmlFor="product-price">
               价格
            </FieldLabel>
            <Input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="请输入价格"
              value={formPrice}
              onChange={(e) => {
                setFormPrice(e.target.value)
                if (priceError) setPriceError("")
              }}
              aria-invalid={!!priceError || undefined}
            />
            {priceError && <FieldError>{priceError}</FieldError>}
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
