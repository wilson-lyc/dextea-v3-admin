import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { ProductStatus } from "@dextea/shared-types"
import { PRODUCT_STATUS, PRODUCT_STATUS_VALUES } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
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
import { createProduct, getTags } from "@/services"

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
  const [formStatus, setFormStatus] = useState(String(PRODUCT_STATUS.ON.value))
  const [formTagIds, setFormTagIds] = useState<string[]>([])
  const [allTags, setAllTags] = useState<{ id: number; name: string }[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [nameError, setNameError] = useState("")
  const [priceError, setPriceError] = useState("")

  useEffect(() => {
    if (!open) {
      setFormName("")
      setFormBrief("")
      setFormDescription("")
      setFormPrice("")
      setFormStatus(String(PRODUCT_STATUS.ON.value))
      setFormTagIds([])
      setNameError("")
      setPriceError("")
    }
  }, [open])

  useEffect(() => {
    if (open) {
      getTags()
        .then((res) => setAllTags(res.data))
        .catch(() => {})
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
        tagIds: formTagIds.map(Number),
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

        <ScrollArea className="max-h-[60vh] p-[5px]">
        <FieldGroup className="py-2">
          <Field data-invalid={!!nameError || undefined}>
            <FieldLabel htmlFor="product-name">
              商品名称 <span className="text-destructive">*</span>
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
              简介 <span className="text-destructive">*</span>
            </FieldLabel>
            <Textarea
              id="product-brief"
              placeholder="请输入商品简介"
              value={formBrief}
              onChange={(e) => setFormBrief(e.target.value)}
              rows={2}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="product-description">
              描述 <span className="text-destructive">*</span>
            </FieldLabel>
            <Textarea
              id="product-description"
              placeholder="请输入商品描述"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
            />
          </Field>

          <Field data-invalid={!!priceError || undefined}>
            <FieldLabel htmlFor="product-price">
              价格 <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formPrice}
              onChange={(e) => {
                setFormPrice(e.target.value)
                if (priceError) setPriceError("")
              }}
              aria-invalid={!!priceError || undefined}
            />
            {priceError && <FieldError>{priceError}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>
              标签 <span className="text-destructive">*</span>
            </FieldLabel>
            <Combobox value={formTagIds} onValueChange={setFormTagIds} multiple>
              <ComboboxChips>
                {formTagIds.map((id) => {
                  const tag = allTags.find((t) => String(t.id) === id)
                  return tag ? (
                    <ComboboxChip key={id} value={id}>
                      {tag.name}
                    </ComboboxChip>
                  ) : null
                })}
                <ComboboxChipsInput placeholder="搜索或选择标签..." />
              </ComboboxChips>
              <ComboboxContent>
                <ComboboxList>
                  {allTags.map((tag) => (
                    <ComboboxItem key={tag.id} value={String(tag.id)}>
                      {tag.name}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </Field>

          <Field>
            <FieldLabel htmlFor="product-status">
              状态 <span className="text-destructive">*</span>
            </FieldLabel>
            <Select value={formStatus} onValueChange={setFormStatus}>
              <SelectTrigger>
                <SelectValue placeholder="请选择状态">
                  {formStatus === String(PRODUCT_STATUS.OFF.value) ? '下架' : '可售'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.values(PRODUCT_STATUS).map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.value === 0 ? '下架' : '可售'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        </ScrollArea>

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
