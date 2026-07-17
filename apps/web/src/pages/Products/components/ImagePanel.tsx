import { useCallback, useEffect, useState } from "react"
import { ImageIcon, ImagesIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import type {
  GalleryImage,
  ProductImage,
  SetProductImagesRequest,
} from "@/api"
import { getProductImages, setProductImages } from "@/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import GalleryPicker from "@/components/ui/GalleryPicker"

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

  const openPicker = (mode: Exclude<PickerMode, null>) => {
    setPickerMode(mode)
    setPickerOpen(true)
  }

  // 任何改动（设置封面 / 添加图库 / 移除 / 排序）后立即保存
  const persist = async (
    nextCover: ProductImage | null,
    nextGallery: ProductImage[],
    successMsg = "已保存",
  ) => {
    setSaving(true)
    try {
      const payload: SetProductImagesRequest = {
        coverImageId: nextCover?.id ?? null,
        galleryImageIds: nextGallery.map((i) => i.id),
      }
      const res = await setProductImages(productId, payload)
      if (res.code === 0) {
        setCover(res.data.cover)
        setGallery(res.data.gallery)
        toast.success(res.message || successMsg)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const handlePickerConfirm = (images: GalleryImage[]) => {
    if (pickerMode === "cover") {
      const img = images[0]
      if (img) void persist(img, gallery, "封面已设置")
    } else if (pickerMode === "gallery") {
      const existing = new Set(gallery.map((i) => i.id))
      const added = images.filter((i) => !existing.has(i.id))
      if (added.length > 0) void persist(cover, [...gallery, ...added], "图片已添加")
    }
  }

  const moveGallery = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= gallery.length) return
    const next = [...gallery]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    void persist(cover, next, "顺序已更新")
  }

  const removeGallery = (index: number) => {
    const next = gallery.filter((_, i) => i !== index)
    void persist(cover, next, "图片已移除")
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 封面图 */}
      <Card>
        <CardHeader>
          <CardTitle>封面图</CardTitle>
          <CardAction>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => openPicker("cover")}
              >
                <ImagesIcon data-icon="inline-start" />
                从图库添加
              </Button>
              {cover && (
                <Button
                  variant="outline-destructive"
                  onClick={() => setRemoveCoverOpen(true)}
                >
                  <Trash2Icon data-icon="inline-start" />
                  移除
                </Button>
              )}
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {cover ? (
            <ImageThumb src={cover.url} alt={cover.url} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-12 text-center">
              <ImageIcon className="size-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">暂无封面图</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 图库 */}
      <Card>
        <CardHeader>
          <CardTitle>详情页图册</CardTitle>
          <CardAction>
            <Button
              variant="outline"
              onClick={() => openPicker("gallery")}
              disabled={gallery.length >= MAX_GALLERY}
            >
              <ImagesIcon data-icon="inline-start" />
              从图库添加
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {gallery.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-12 text-center">
              <ImageIcon className="size-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">暂无详情页图册</span>
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

      {/* 图库选择器 */}
      <GalleryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        multiple={pickerMode === "gallery"}
        disabledIds={pickerMode === "gallery" ? gallery.map((i) => i.id) : []}
        maxSelect={pickerMode === "gallery" ? MAX_GALLERY - gallery.length : undefined}
        title={pickerMode === "gallery" ? "选择详情页图册图片" : "从图库选择封面"}
        onConfirm={handlePickerConfirm}
      />

      {/* 移除封面确认 */}
      <ConfirmDialog
        open={removeCoverOpen}
        onOpenChange={setRemoveCoverOpen}
        title="移除封面图"
        description="确定要移除当前封面图吗？移除后仍可重新选择。"
        confirmText="确认移除"
        onConfirm={() => {
          setRemoveCoverOpen(false)
          void persist(null, gallery, "封面已移除")
        }}
      />
    </div>
  )
}
