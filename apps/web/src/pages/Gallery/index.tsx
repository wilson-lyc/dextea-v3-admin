import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  HardDriveIcon,
  ImageIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { GalleryImage, StorageLocationOption } from "@/api"
import {
  deleteGalleryImage,
  getGalleryImages,
  getStorageLocationOptions,
  uploadGalleryImage,
} from "@/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DialogDescription,
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
import { SelectPicker } from "@/components/ui/select-picker"
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
  const navigate = useNavigate()
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

  // 存储位置筛选（null = 全部）
  const [locations, setLocations] = useState<StorageLocationOption[]>([])
  const [filterLocationId, setFilterLocationId] = useState<number | null>(null)
  const [noLocations, setNoLocations] = useState(false)
  const [noLocationDialogOpen, setNoLocationDialogOpen] = useState(false)

  // 上传弹窗
  const [uploadOpen, setUploadOpen] = useState(false)
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const [uploading, setUploading] = useState(false)
  const [pickLocationId, setPickLocationId] = useState<number | null>(null)

  const fetchImages = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const params: {
        page: number
        pageSize: number
        keyword?: string
        storageLocationId?: number
      } = { page: targetPage, pageSize: PAGE_SIZE }
      if (keywordRef.current.trim()) params.keyword = keywordRef.current.trim()
      if (filterLocationId != null) params.storageLocationId = filterLocationId
      const res = await getGalleryImages(params)
      setImages(res.data.items)
      setTotal(res.data.total)
      setPage(targetPage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取图片列表失败")
    } finally {
      setLoading(false)
    }
  }, [filterLocationId])

  // 进入页面先检查是否配置过存储位置，没有则引导配置
  useEffect(() => {
    getStorageLocationOptions()
      .then((res) => {
        const opts = res.data ?? []
        setLocations(opts)
        if (opts.length === 0) {
          setNoLocations(true)
          setNoLocationDialogOpen(true)
          setLoading(false)
        }
      })
      .catch(() => {
        setLocations([])
        setNoLocations(true)
        setNoLocationDialogOpen(true)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!noLocations) fetchImages(1)
  }, [noLocations, fetchImages])

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

  const hasFilters = keyword.trim().length > 0 || filterLocationId != null

  // ─── 上传 ───
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"))
    if (files.length === 0) {
      toast.error("仅支持上传图片文件")
      return
    }
    setTasks((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        file,
        preview: URL.createObjectURL(file),
        status: "pending" as const,
        progress: 0,
      })),
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
        await uploadGalleryImage(task.file, (pct) => {
          setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, progress: pct } : t)))
        }, pickLocationId)
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
          <Button onClick={() => setUploadOpen(true)} disabled={noLocations}>
            <PlusIcon data-icon="inline-start" />
            上传图片
          </Button>
        }
        toolbarRight={
          <div className="flex items-center gap-2">
            <SelectPicker
              options={[
                { label: "全部存储位置", value: "" },
                ...locations.map((loc) => ({ label: loc.name, value: String(loc.id) })),
              ]}
              value={filterLocationId != null ? String(filterLocationId) : ""}
              onValueChange={(v) => {
                const id = v ? Number(v) : null
                setFilterLocationId(id)
                const params: {
                  page: number
                  pageSize: number
                  keyword?: string
                  storageLocationId?: number
                } = { page: 1, pageSize: PAGE_SIZE }
                if (keywordRef.current.trim()) params.keyword = keywordRef.current.trim()
                if (id != null) params.storageLocationId = id
                getGalleryImages(params)
                  .then((res) => {
                    setImages(res.data.items)
                    setTotal(res.data.total)
                    setPage(1)
                  })
                  .catch(() => toast.error("获取图片列表失败"))
              }}
              placeholder="全部存储位置"
              className="w-40"
            />
            <div className="relative max-w-sm">
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
              <TableHead>存储位置</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={images.map((img) => (
          <TableRow key={img.id}>
            <TableCell className="font-mono text-xs">{img.id}</TableCell>
            <TableCell>
              <div className="size-12 overflow-hidden rounded bg-muted">
                <img
                  src={img.url}
                  alt={`图片 ${img.id}`}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
            </TableCell>
            <TableCell>{img.storageLocationName ?? "默认存储位置"}</TableCell>
            <TableCell>{new Date(img.createdAt).toLocaleString("zh-CN")}</TableCell>
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

      {/* 未配置存储位置时，弹窗提示需先创建存储位置 */}
      <Dialog
        open={noLocationDialogOpen}
        disablePointerDismissal
        onOpenChange={(open) => {
          if (open) setNoLocationDialogOpen(true)
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardDriveIcon className="size-4" />
              未配置存储位置
            </DialogTitle>
            <DialogDescription>
              使用图库前，请先创建至少一个可用的存储位置。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate("/storage-locations")}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 上传图片弹窗 */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!open) closeUpload() }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>上传图片</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>存储位置</Label>
              <Select
                value={pickLocationId != null ? String(pickLocationId) : "default"}
                onValueChange={(v) =>
                  setPickLocationId(v == null || v === "default" ? null : Number(v))
                }
              >
                <SelectTrigger className="w-full">
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

            <div className="space-y-1.5">
              <Label>选择照片</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50">
                <UploadIcon className="size-7 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">点击选择图片</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    支持多选，单文件最大 10MB，仅限图片格式
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files)
                    e.target.value = ""
                  }}
                />
              </label>
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
            <Button onClick={handleUpload} disabled={uploading}>
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
