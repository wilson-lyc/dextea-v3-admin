"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckIcon, ImageIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import type { GalleryImage } from "@/api"
import { getGalleryImages } from "@/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import PaginationBar from "@/components/ui/pagination-bar"

const PAGE_SIZE = 24

interface GalleryPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 是否允许多选，默认 false（单选，用于封面） */
  multiple?: boolean
  /** 已在商品中绑定的图片 id，选择器内会标记为「已绑定」并禁用，避免重复关联 */
  disabledIds?: number[]
  /** 多选时最多可选数量（达到上限后未选项禁用） */
  maxSelect?: number
  /** 确认回调，返回选中的图片 */
  onConfirm: (images: GalleryImage[]) => void
  title?: string
}

/**
 * 图库选择器：从已有的图片资源池中选择图片进行关联。
 * - 单选模式（multiple=false）适用于选择封面图
 * - 多选模式（multiple=true）适用于批量添加商品图库
 */
export default function GalleryPicker({
  open,
  onOpenChange,
  multiple = false,
  disabledIds = [],
  maxSelect,
  onConfirm,
  title,
}: GalleryPickerProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [picked, setPicked] = useState<Record<number, GalleryImage>>({})

  const disabledSet = new Set(disabledIds)

  const fetchImages = useCallback(
    async (targetPage: number) => {
      setLoading(true)
      try {
        const params: { page: number; pageSize: number; keyword?: string } = {
          page: targetPage,
          pageSize: PAGE_SIZE,
        }
        if (searchKeyword.trim()) params.keyword = searchKeyword.trim()
        const res = await getGalleryImages(params)
        if (res.code === 0) {
          setImages(res.data.items)
          setTotal(res.data.total)
          setPage(targetPage)
        } else {
          toast.error(res.message)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "获取图库失败")
      } finally {
        setLoading(false)
      }
    },
    [searchKeyword],
  )

  // 每次打开时重置选择、搜索与分页
  useEffect(() => {
    if (open) {
      setPicked({})
      setKeyword("")
      setSearchKeyword("")
      void fetchImages(1)
    }
  }, [open, fetchImages])

  const pickedList = Object.values(picked)
  const pickedCount = pickedList.length
  const reachedLimit = maxSelect !== undefined && pickedCount >= maxSelect

  const toggle = (img: GalleryImage) => {
    if (disabledSet.has(img.id)) return
    if (multiple) {
      setPicked((prev) => {
        const next = { ...prev }
        if (next[img.id]) {
          delete next[img.id]
        } else {
          if (reachedLimit) {
            toast.error(`最多选择 ${maxSelect} 张`)
            return prev
          }
          next[img.id] = img
        }
        return next
      })
    } else {
      setPicked({ [img.id]: img })
    }
  }

  const handleSearch = () => {
    setSearchKeyword(keyword)
    void fetchImages(1)
  }

  const handleConfirm = () => {
    onConfirm(pickedList)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title ?? (multiple ? "从图库选择图片" : "从图库选择封面")}</DialogTitle>
        </DialogHeader>

        {/* 搜索 */}
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索图片"
              className="pl-8"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch()
              }}
            />
          </div>
          <Button variant="secondary" onClick={handleSearch}>
            搜索
          </Button>
        </div>

        {/* 图片网格 */}
        <div className="min-h-40 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner className="size-6" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <ImageIcon className="size-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">图库中暂无图片</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {images.map((img) => {
                const isPicked = !!picked[img.id]
                const isDisabled = disabledSet.has(img.id)
                return (
                  <button
                    type="button"
                    key={img.id}
                    disabled={isDisabled}
                    onClick={() => toggle(img)}
                    className={[
                      "relative aspect-square overflow-hidden rounded-lg border-2 bg-muted transition-colors",
                      isPicked ? "border-primary" : "border-transparent hover:border-primary/40",
                      isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                    ].join(" ")}
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      title={img.name}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                    {isDisabled && (
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[10px] text-white">
                        已绑定
                      </span>
                    )}
                    {isPicked && (
                      <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-white">
                        <CheckIcon className="size-3" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 分页 */}
        {total > PAGE_SIZE && (
          <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} onPageChange={fetchImages} />
        )}

        <DialogFooter>
          {multiple && (
            <span className="mr-auto text-xs text-muted-foreground">
              已选 {pickedCount}
              {maxSelect !== undefined ? ` / ${maxSelect}` : ""} 张
            </span>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={pickedCount === 0}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
