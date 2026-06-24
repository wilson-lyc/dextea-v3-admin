import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { ProductStatus } from "@dextea/shared-types"
import { PRODUCT_STATUS, PRODUCT_STATUS_VALUES } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { createProduct } from "@/services"

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

const CATEGORY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "未分类" },
]

export function CreateProductDialog({ open, onOpenChange, onCreated }: CreateProductDialogProps) {
  const [formName, setFormName] = useState("")
  const [formBrief, setFormBrief] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [formCategoryId, setFormCategoryId] = useState("0")
  const [formStatus, setFormStatus] = useState(String(PRODUCT_STATUS.ON.value))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setFormName("")
      setFormBrief("")
      setFormDescription("")
      setFormPrice("")
      setFormCategoryId("0")
      setFormStatus(String(PRODUCT_STATUS.ON.value))
    }
  }, [open])

  const handleSubmit = async () => {
    if (!formName) {
      toast.error("商品名称不能为空")
      return
    }

    const price = parseFloat(formPrice)
    if (formPrice !== "" && (isNaN(price) || price < 0)) {
      toast.error("商品价格无效")
      return
    }

    const status: ProductStatus = PRODUCT_STATUS_VALUES.includes(Number(formStatus) as ProductStatus)
      ? (Number(formStatus) as ProductStatus)
      : PRODUCT_STATUS.ON.value

    setSubmitting(true)
    try {
      const res = await createProduct({
        name: formName,
        brief: formBrief,
        description: formDescription,
        price: formPrice !== "" ? price : 0,
        categoryId: Number(formCategoryId),
        status,
      })
      if (res.code === 0) {
        toast.success(res.message)
        onOpenChange(false)
        onCreated()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败")
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

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-name">
              商品名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="product-name"
              placeholder="请输入商品名称"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-brief">简介</Label>
            <Input
              id="product-brief"
              placeholder="请输入商品简介"
              value={formBrief}
              onChange={(e) => setFormBrief(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-description">描述</Label>
            <Textarea
              id="product-description"
              placeholder="请输入商品描述"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-price">
              价格 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-category">分类</Label>
            <Select value={formCategoryId} onValueChange={setFormCategoryId}>
              <SelectTrigger id="product-category">
                <SelectValue placeholder="请选择分类" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-status">状态</Label>
            <Select value={formStatus} onValueChange={setFormStatus}>
              <SelectTrigger id="product-status">
                <SelectValue placeholder="请选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(PRODUCT_STATUS.ON.value)}>
                  {PRODUCT_STATUS.ON.label}
                </SelectItem>
                <SelectItem value={String(PRODUCT_STATUS.OFF.value)}>
                  {PRODUCT_STATUS.OFF.label}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
