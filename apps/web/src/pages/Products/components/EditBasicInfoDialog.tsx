import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { Product } from "@dextea/shared-types"
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
import { updateProduct } from "@/services"

interface EditBasicInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
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
              商品名称 <span className="text-destructive">*</span>
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
            <FieldLabel htmlFor="edit-brief">简介</FieldLabel>
            <Input
              id="edit-brief"
              placeholder="请输入简介"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-description">描述</FieldLabel>
            <Input
              id="edit-description"
              placeholder="请输入描述"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-price">价格</FieldLabel>
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
