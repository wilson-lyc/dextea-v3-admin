import { useCallback, useEffect, useRef, useState } from "react"
import {
  HardDriveIcon,
  ImageIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type { GalleryImage, StorageLocationOption } from "@/api"
import {
  deleteGalleryImage,
  getGalleryImages,
  getStorageLocationOptions,
  uploadGalleryImage,
} from "@/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import PaginationBar from "@/components/ui/pagination-bar"
import { Spinner } from "@/components/ui/spinner"

const PAGE_SIZE = 24

type UploadStatus = "uploading" | "done" | "error"

interface UploadTask {
  id: string
  name: string
  progress: number
  status: UploadStatus
  error?: string
  preview: string
  file: File
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [dragging, setDragging] = useState(false)
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 存储位置下拉与当前选择（null = 默认存储位置，由后端取首个启用位置）
  const [locations, setLocations] = useState<StorageLocationOption[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)

  const fetchImages = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getGalleryImages({
        page: targetPage,
        pageSize: PAGE_SIZE,
        ...(selectedLocationId != null
          ? { storageLocationId: selectedLocationId }
          : {}),
      })
      setImages(res.data.items)
      setTotal(res.data.total)
      setPage(targetPage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取图片列表失败")
    } finally {
      setLoading(false)
    }
  }, [selectedLocationId])

  useEffect(() => {
    fetchImages(1)
  }, [selectedLocationId, fetchImages])

  useEffect(() => {
    getStorageLocationOptions()
      .then((res) => setLocations(res.data))
      .catch(() => setLocations([]))
  }, [])

  const runUploads = useCallback(
    async (files: File[]) => {
      const newTasks: UploadTask[] = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        progress: 0,
        status: "uploading",
        preview: URL.createObjectURL(file),
        file,
      }))

      setTasks((prev) => [...prev, ...newTasks])

      for (const task of newTasks) {
        try {
          await uploadGalleryImage(task.file, (pct) => {
            setTasks((prev) =>
              prev.map((t) => (t.id === task.id ? { ...t, progress: pct } : t)),
            )
          }, selectedLocationId)
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id ? { ...t, status: "done", progress: 100 } : t,
            ),
          )
        } catch (err) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    status: "error",
                    error: err instanceof Error ? err.message : "上传失败",
                  }
                : t,
            ),
          )
        }
      }

      // 上传完成后刷新列表，保证展示状态同步
      await fetchImages(page)

      // 清理已完成的任务（释放预览内存）
      setTimeout(() => {
        setTasks((prev) => {
          prev.forEach((t) => {
            if (t.status === "done") URL.revokeObjectURL(t.preview)
          })
          return prev.filter((t) => t.status !== "done")
        })
      }, 1500)
    },
    [fetchImages, page, selectedLocationId],
  )

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"))
    if (files.length === 0) {
      toast.error("仅支持上传图片文件")
      return
    }
    void runUploads(files)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.target.value = ""
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
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
        // 删除后刷新列表，保证状态同步
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
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">图库</h1>
          <p className="text-sm text-muted-foreground">
            管理图片资源，支持多图上传、缩略图预览与删除
          </p>
        </div>
      </div>

      {/* 存储位置选择 */}
      <div className="flex items-center gap-3">
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
          <HardDriveIcon className="size-4" />
          存储位置
        </span>
        <Select
          value={selectedLocationId != null ? String(selectedLocationId) : "default"}
          onValueChange={(v) =>
            setSelectedLocationId(v == null || v === "default" ? null : Number(v))
          }
        >
          <SelectTrigger className="w-72">
            <SelectValue placeholder="默认存储位置" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">默认存储位置</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={String(loc.id)}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 上传区 */}
      <Card>
        <CardContent className="p-6">
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
              dragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50",
            )}
          >
            <UploadIcon className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">点击或拖拽图片到此处上传</p>
              <p className="mt-1 text-xs text-muted-foreground">
                支持多选，单文件最大 10MB，仅限图片格式
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onInputChange}
            />
          </label>

          {tasks.length > 0 && (
            <div className="mt-4 space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="size-10 shrink-0 overflow-hidden rounded bg-muted">
                    {task.preview ? (
                      <img
                        src={task.preview}
                        alt={task.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="m-auto size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm">{task.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {task.status === "done" ? (
                          "已完成"
                        ) : task.status === "error" ? (
                          <span className="text-destructive">
                            {task.error ?? "上传失败"}
                          </span>
                        ) : (
                          `${task.progress}%`
                        )}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          task.status === "error"
                            ? "bg-destructive"
                            : task.status === "done"
                              ? "bg-green-500"
                              : "bg-primary",
                        )}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 浏览列表 */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="size-6" />
        </div>
      ) : images.length === 0 ? (
        <Empty className="border border-dashed py-16">
          <EmptyMedia variant="icon">
            <ImageIcon className="size-5" />
          </EmptyMedia>
          <EmptyTitle>暂无图片</EmptyTitle>
          <EmptyDescription>
            上传图片后将在此处展示缩略图
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {images.map((img) => (
            <Card key={img.id} className="group overflow-hidden">
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={img.url}
                  alt={`图片 ${img.id}`}
                  loading="lazy"
                  className="size-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon-sm"
                  className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => openDelete(img)}
                  aria-label="删除图片"
                >
                  <Trash2Icon />
                </Button>
              </div>
              <CardContent className="space-y-1 p-3">
                <p className="truncate text-sm" title={img.url}>
                  {`图片 #${img.id}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {img.storageLocationName ?? "默认存储位置"} ·{" "}
                  {new Date(img.createdAt).toLocaleDateString("zh-CN")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && images.length > 0 && (
        <PaginationBar
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={fetchImages}
        />
      )}

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
    </div>
  )
}
