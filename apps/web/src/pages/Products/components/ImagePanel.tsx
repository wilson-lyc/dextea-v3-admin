import { useCallback, useEffect, useState } from "react"
import { ImageIcon, ImagesIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import type {
  GalleryImage,
  ProductImage,
  GetProductImagesResponse,
  SetProductImagesRequest,
} from "@/api"
import { getProductImages, setProductImages } from "@/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import GalleryPicker from "@/components/GalleryPicker"

const MAX_GALLERY = 10

type PickerMode = "cover" | "gallery" | null

interface ImagePanelProps {
  productId: number
}

function ImageThumb({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="size-28 shrink-0 overflow-hidden rounded-lg border bg-muted">
      <img src={src} alt={alt} className="size-full object-cover" />
    </div>
  )
}

export default function ImagePanel({ productId }: ImagePanelProps) {
  const [initial, setInitial] = useState<GetProductImagesResponse | null>(null)
  const [cover, setCover] = useState<ProductImage | null>(null)
  const [gallery, setGallery] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [removeCoverOpen, setRemoveCoverOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<PickerMode>(null)

  const fetchImages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getProductImages(productId)
      if (res.code === 0) {
        setInitial(res.data)
        setCover(res.data.cover)
        setGallery(res.data.gallery)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取商品图片失败")
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  // 是否已修改（用于保存按钮状态与禁用判断）
  const dirty =
    initial !== null &&
    ((initial.cover?.id ?? null) !== (cover?.id ?? null) ||
      initial.gallery.map((i) => i.id).join(",") !==
        gallery.map((i) => i.id).join(","))

  const openPicker = (mode: Exclude<PickerMode, null>) => {
    setPickerMode(mode)
    setPickerOpen(true)
  }

  const handlePickerConfirm = (images: GalleryImage[]) => {
    if (pickerMode === "cover") {
      const img = images[0]
      if (img) {
        setCover(img)
        toast.success("封面已选择，记得点击「保存」")
      }
    } else if (pickerMode === "gallery") {
      setGallery((prev) => {
        const existing = new Set(prev.map((i) => i.id))
        const added = images.filter((i) => !existing.has(i.id))
        return [...prev, ...added]
      })
      toast.success("图片已添加，记得点击「保存」")
    }
  }

  const moveGallery = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= gallery.length) return
    setGallery((prev) => {
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const removeGallery = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: SetProductImagesRequest = {
        coverImageId: cover?.id ?? null,
        galleryImageIds: gallery.map((i) => i.id),
      }
      const res = await setProductImages(productId, payload)
      if (res.code === 0) {
        toast.success(res.message || "保存成功")
        setInitial(res.data)
        setCover(res.data.cover)
        setGallery(res.data.gallery)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* 封面图 */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">封面图</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                有且仅有一张，可暂时不设置，后期在图库中选择
              </p>
            </div>
            {cover && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPicker("cover")}
                >
                  <ImagesIcon data-icon="inline-start" />
                  更换封面
                </Button>
                <Button
                  variant="outline-destructive"
                  size="sm"
                  onClick={() => setRemoveCoverOpen(true)}
                >
                  <Trash2Icon data-icon="inline-start" />
                  移除
                </Button>
              </div>
            )}
          </div>

          {cover ? (
            <ImageThumb src={cover.url} alt={cover.url} />
          ) : (
            <button
              type="button"
              onClick={() => openPicker("cover")}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:border-primary/50"
            >
              <ImagesIcon className="size-7 text-muted-foreground" />
              <span className="text-sm font-medium">从图库选择封面图</span>
              <span className="text-xs text-muted-foreground">从已上传的图库中选择一张作为封面</span>
            </button>
          )}
        </CardContent>
      </Card>

      {/* 图库 */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">图库</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                最多 {MAX_GALLERY} 张，可调整顺序后保存
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPicker("gallery")}
              disabled={gallery.length >= MAX_GALLERY}
            >
              <ImagesIcon data-icon="inline-start" />
              从图库添加
            </Button>
          </div>

          {gallery.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-12 text-center">
              <ImageIcon className="size-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">暂无图库图片</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {gallery.map((img, index) => (
                <div key={img.id} className="rounded-lg border p-2">
                  <div className="relative aspect-square overflow-hidden rounded bg-muted">
                    <img src={img.url} alt={img.url} className="size-full object-cover" />
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      className="absolute right-1.5 top-1.5"
                      onClick={() => removeGallery(index)}
                      aria-label="移除图片"
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => moveGallery(index, -1)}
                    >
                      左移
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={index === gallery.length - 1}
                      onClick={() => moveGallery(index, 1)}
                    >
                      右移
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 保存栏 */}
      <div className="flex items-center justify-end gap-3">
        {dirty && <span className="text-xs text-muted-foreground">有未保存的修改</span>}
        <Button onClick={handleSave} disabled={!dirty || saving}>
          {saving ? "保存中…" : "保存图片设置"}
        </Button>
      </div>

      {/* 图库选择器 */}
      <GalleryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        multiple={pickerMode === "gallery"}
        disabledIds={pickerMode === "gallery" ? gallery.map((i) => i.id) : []}
        maxSelect={pickerMode === "gallery" ? MAX_GALLERY - gallery.length : undefined}
        title={pickerMode === "gallery" ? "从图库选择图片" : "从图库选择封面"}
        onConfirm={handlePickerConfirm}
      />

      {/* 移除封面确认 */}
      <ConfirmDialog
        open={removeCoverOpen}
        onOpenChange={setRemoveCoverOpen}
        title="移除封面图"
        description="确定要移除当前封面图吗？移除后仍可重新上传。"
        confirmText="确认移除"
        onConfirm={() => {
          setCover(null)
          setRemoveCoverOpen(false)
          toast.success("封面已移除，记得点击「保存」")
        }}
      />
    </div>
  )
}
