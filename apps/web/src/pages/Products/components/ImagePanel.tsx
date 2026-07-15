import { useCallback, useEffect, useRef, useState } from "react"
import { ImageIcon, Trash2Icon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import type {
  ProductImage,
  GetProductImagesResponse,
  SetProductImagesRequest,
} from "@/api"
import { getProductImages, setProductImages, uploadGalleryImage } from "@/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import ConfirmDialog from "@/components/ui/confirm-dialog"

const MAX_GALLERY = 10

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

function toProductImage(
  data: Awaited<ReturnType<typeof uploadGalleryImage>>["data"],
): ProductImage {
  return {
    id: data.id,
    url: data.url,
    fileName: data.fileName,
    fileSize: data.fileSize,
    provider: data.provider,
    contentType: data.contentType,
    createdAt: data.createdAt,
  }
}

export default function ImagePanel({ productId }: ImagePanelProps) {
  const [initial, setInitial] = useState<GetProductImagesResponse | null>(null)
  const [cover, setCover] = useState<ProductImage | null>(null)
  const [gallery, setGallery] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [removeCoverOpen, setRemoveCoverOpen] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

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
    (initial.cover?.id ?? null) !== (cover?.id ?? null) ||
    initial.gallery.map((i) => i.id).join(",") !== gallery.map((i) => i.id).join(",")

  const uploadAndMap = async (file: File): Promise<ProductImage | null> => {
    setUploading(true)
    try {
      const res = await uploadGalleryImage(file)
      if (res.code === 0) {
        return toProductImage(res.data)
      }
      toast.error(res.message)
      return null
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "上传失败")
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleCoverFile = async (file: File) => {
    const image = await uploadAndMap(file)
    if (image) {
      setCover(image)
      toast.success("封面上传成功，记得点击「保存」")
    }
  }

  const handleGalleryFile = async (file: File) => {
    if (gallery.length >= MAX_GALLERY) {
      toast.error(`图库最多 ${MAX_GALLERY} 张`)
      return
    }
    const image = await uploadAndMap(file)
    if (image) {
      setGallery((prev) => [...prev, image])
      toast.success("图片已添加，记得点击「保存」")
    }
  }

  const onCoverInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleCoverFile(file)
    e.target.value = ""
  }

  const onGalleryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleGalleryFile(file)
    e.target.value = ""
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
                有且仅有一张，可暂时不设置，后期在此补传
              </p>
            </div>
            {cover && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading}
                >
                  <UploadIcon data-icon="inline-start" />
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
            <ImageThumb src={cover.url} alt={cover.fileName} />
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:border-primary/50"
            >
              <UploadIcon className="size-7 text-muted-foreground" />
              <span className="text-sm font-medium">点击上传封面图</span>
              <span className="text-xs text-muted-foreground">仅支持图片格式，单文件最大 10MB</span>
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
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading || gallery.length >= MAX_GALLERY}
            >
              <UploadIcon data-icon="inline-start" />
              添加图片
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
                    <img src={img.url} alt={img.fileName} className="size-full object-cover" />
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
                  <p className="mt-2 truncate text-xs text-muted-foreground" title={img.fileName}>
                    {img.fileName}
                  </p>
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
        <Button onClick={handleSave} disabled={!dirty || saving || uploading}>
          {saving ? "保存中…" : "保存图片设置"}
        </Button>
      </div>

      {/* 隐藏的文件选择器 */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onCoverInputChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onGalleryInputChange}
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
