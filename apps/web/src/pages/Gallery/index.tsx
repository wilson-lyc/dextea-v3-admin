import { useCallback, useEffect, useRef, useState } from "react"
import {
  ImageIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
  ZoomInIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { GalleryImage } from "@/api"
import {
  deleteGalleryImage,
  getGalleryImages,
  uploadGalleryImage,
} from "@/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import DataTable from "@/components/ui/data-table"
import ConfirmDialog from "@/components/ui/confirm-dialog"

const PAGE_SIZE = 20

type UploadStatus = "pending" | "uploading" | "done" | "error"

interface UploadTask {
  id: string
  name: string
  file: File
  preview: string
  status: UploadStatus
  progress: number
  error?: string
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [keyword, setKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const keywordRef = useRef("")
  keywordRef.current = searchKeyword

  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 大图预览
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null)

  // 上传弹窗
  const [uploadOpen, setUploadOpen] = useState(false)
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const [uploading, setUploading] = useState(false)
  const [imageName, setImageName] = useState("")

  const fetchImages = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const params: {
        page: number
        pageSize: number
        keyword?: string
      } = { page: targetPage, pageSize: PAGE_SIZE }
      if (keywordRef.current.trim()) params.keyword = keywordRef.current.trim()
      const res = await getGalleryImages(params)
      setImages(res.data.items)
      setTotal(res.data.total)
      setPage(targetPage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取图片列表失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchImages(1)
  }, [fetchImages])

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await fetchImages(page)
    toast.success("刷新成功")
  }, [fetchImages, page])

  const handleSearch = () => {
    setSearchKeyword(keyword)
    fetchImages(1)
  }

  const handleClear = () => {
    setKeyword("")
    setSearchKeyword("")
    keywordRef.current = ""
    fetchImages(1)
  }

  const hasFilters = keyword.trim().length > 0

  // ─── 上传 ───
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const file = fileList[0]
    if (!file.type.startsWith("image/")) {
      toast.error("仅支持上传图片文件")
      return
    }
    // 仅允许单张：直接覆盖已有选择
    setTasks([
      {
        id: crypto.randomUUID(),
        name: file.name,
        file,
        preview: URL.createObjectURL(file),
        status: "pending" as const,
        progress: 0,
      },
    ])
  }

  const removeTask = (id: string) => {
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id)
      if (target && target.status !== "uploading") URL.revokeObjectURL(target.preview)
      return prev.filter((t) => t.id !== id)
    })
  }

  const handleUpload = async () => {
    const name = imageName.trim()
    if (!name) {
      toast.error("请填写图片名称")
      return
    }
    const pending = tasks.filter((t) => t.status !== "done" && t.status !== "uploading" && t.status !== "error")
    if (pending.length === 0) {
      toast.error("请先选择要上传的图片")
      return
    }
    setUploading(true)
    for (const task of pending) {
      try {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: "uploading", progress: 0 } : t)),
        )
        await uploadGalleryImage(task.file, name, (pct) => {
          setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, progress: pct } : t)))
        })
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: "done", progress: 100 } : t)),
        )
      } catch (err) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: "error", error: err instanceof Error ? err.message : "上传失败" }
              : t,
          ),
        )
      }
    }
    setUploading(false)
    setImageName("")
    await fetchImages(page)
    toast.success("上传完成")
  }

  // 弹窗关闭时释放预览内存
  const closeUpload = () => {
    tasks.forEach((t) => {
      if (t.status !== "uploading") URL.revokeObjectURL(t.preview)
    })
    setTasks([])
    setUploading(false)
    setImageName("")
    setUploadOpen(false)
  }

  const openDelete = (img: GalleryImage) => setDeleteTarget(img)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await deleteGalleryImage(deleteTarget.id)
      if (res.code === 0) {
        toast.success(res.message || "删除成功")
        setDeleteTarget(null)
        await fetchImages(page)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <DataTable
        className="p-6"
        toolbarLeft={
          <Button onClick={() => setUploadOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            上传图片
          </Button>
        }
        toolbarRight={
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索图片名称"
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
            {hasFilters && (
              <Button variant="ghost" onClick={handleClear}>
                清除
              </Button>
            )}
          </div>
        }
        header={
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead className="w-24">缩略图</TableHead>
              <TableHead>名称</TableHead>
              <TableHead className="w-44">创建时间</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={images.map((img) => (
          <TableRow key={img.id}>
            <TableCell className="font-mono text-xs">{img.id}</TableCell>
            <TableCell>
              <button
                type="button"
                onClick={() => setPreviewImage(img)}
                className="group relative size-12 overflow-hidden rounded bg-muted outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="查看大图"
              >
                <img
                  src={img.url}
                  alt={img.name}
                  loading="lazy"
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <ZoomInIcon className="size-4 text-white" />
                </span>
              </button>
            </TableCell>
            <TableCell className="truncate" title={img.name}>
              {img.name}
            </TableCell>
            <TableCell className="whitespace-nowrap">{new Date(img.createdAt).toLocaleString("zh-CN")}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="outline-destructive" size="sm" onClick={() => openDelete(img)}>
                  删除
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={images.length === 0}
        colSpan={5}
        onRefresh={handleRefresh}
        refreshDisabled={loading}
        emptyIcon={<ImageIcon className="size-4" />}
        emptyText="暂无图片"
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: fetchImages }}
      />

      {/* 上传图片弹窗 */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!open) closeUpload() }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>上传图片</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>选择照片（单张）</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50">
                <UploadIcon className="size-7 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">点击选择单张图片</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    单文件最大 10MB，仅限图片格式
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files)
                    e.target.value = ""
                  }}
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <Label>
                图片名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="请输入图片名称，便于后续检索"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
              />
            </div>

            {tasks.length > 0 && (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg border p-2"
                  >
                    <div className="size-10 shrink-0 overflow-hidden rounded bg-muted">
                      <img src={task.preview} alt={task.name} className="size-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm">{task.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {task.status === "done" ? (
                            "已完成"
                          ) : task.status === "error" ? (
                            <span className="text-destructive">{task.error ?? "上传失败"}</span>
                          ) : task.status === "uploading" ? (
                            `${task.progress}%`
                          ) : (
                            "待上传"
                          )}
                        </span>
                      </div>
                      {task.status === "uploading" && (
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {task.status !== "uploading" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeTask(task.id)}
                        aria-label="移除"
                      >
                        <Trash2Icon />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeUpload}>
              取消
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !imageName.trim() || tasks.length === 0}>
              {uploading ? (
                <>
                  <Spinner className="size-4" />
                  上传中...
                </>
              ) : (
                "开始上传"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 大图预览弹窗 */}
      <Dialog
        open={previewImage !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null)
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="max-w-[calc(100%-2rem)] truncate" title={previewImage?.name}>
              {previewImage?.name}
            </DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-lg bg-muted">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="删除图片"
        description={
          <>
            确定要删除「图片 #{deleteTarget?.id}」吗？此操作不可恢复，且会从对象存储中一并移除。
          </>
        }
        variant="destructive"
        confirmText="删除"
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  )
}
