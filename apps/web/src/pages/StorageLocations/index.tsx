import { useCallback, useEffect, useRef, useState } from "react"
import {
  HardDriveIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  STORAGE_LOCATION_STATUS_LABEL,
  STORAGE_LOCATION_STATUS_TEXT_CLASSES,
} from "@dextea-admin/contracts"
import type { StorageLocation } from "@/api"
import {
  deleteStorageLocation,
  getStorageLocations,
} from "@/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import StorageLocationDialog from "./StorageLocationDialog"

const PAGE_SIZE = 20

export default function StorageLocationsPage() {
  const [list, setList] = useState<StorageLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const keywordRef = useRef("")
  keywordRef.current = searchKeyword

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<StorageLocation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StorageLocation | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchList = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getStorageLocations({
        page: targetPage,
        pageSize: PAGE_SIZE,
        ...(keywordRef.current.trim()
          ? { keyword: keywordRef.current.trim() }
          : {}),
      })
      setList(res.data.items)
      setTotal(res.data.total)
      setPage(targetPage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取列表失败")
    } finally {
      setLoading(false)
    }
  }, [])

  // 刷新（与员工/商品列表风格一致：等待 1 秒后重载）
  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await fetchList(page)
    toast.success("刷新成功")
  }, [fetchList, page])

  useEffect(() => {
    fetchList(1)
  }, [fetchList])

  const handleSearch = () => {
    setKeyword(keywordRef.current)
    setSearchKeyword(keywordRef.current)
    fetchList(1)
  }

  const handleClear = () => {
    setKeyword("")
    setSearchKeyword("")
    keywordRef.current = ""
    fetchList(1)
  }

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (loc: StorageLocation) => {
    setEditing(loc)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await deleteStorageLocation(deleteTarget.id)
      if (res.code === 0) {
        toast.success(res.message || "删除成功")
        setDeleteTarget(null)
        await fetchList(page)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败")
    } finally {
      setDeleteLoading(false)
    }
  }

  const hasFilters = keyword.trim().length > 0

  return (
    <>
      <DataTable
        className="p-6"
        toolbarLeft={
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            新增存储位置
          </Button>
        }
        toolbarRight={
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="按名称搜索"
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
              <TableHead>名称</TableHead>
              <TableHead>厂商</TableHead>
              <TableHead>区域</TableHead>
              <TableHead>存储桶</TableHead>
              <TableHead>AccessKey</TableHead>
              <TableHead className="w-20">状态</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={list.map((loc) => (
          <TableRow key={loc.id}>
            <TableCell className="font-mono text-xs">{loc.id}</TableCell>
            <TableCell className="font-medium">{loc.name}</TableCell>
            <TableCell>{loc.provider}</TableCell>
            <TableCell>{loc.region}</TableCell>
            <TableCell>{loc.bucket}</TableCell>
            <TableCell className="max-w-[160px] truncate">{loc.accessKey}</TableCell>
            <TableCell>
              <span className={STORAGE_LOCATION_STATUS_TEXT_CLASSES[loc.status] ?? ""}>
                {STORAGE_LOCATION_STATUS_LABEL[loc.status] ?? loc.status}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="outline" size="sm" onClick={() => openEdit(loc)}>
                  编辑
                </Button>
                <Button
                  variant="outline-destructive"
                  size="sm"
                  onClick={() => setDeleteTarget(loc)}
                >
                  删除
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={list.length === 0}
        colSpan={8}
        onRefresh={handleRefresh}
        refreshDisabled={loading}
        emptyIcon={<HardDriveIcon className="size-4" />}
        emptyText="暂无存储位置"
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: fetchList }}
      />

      {/* 新增 / 编辑弹窗 */}
      <StorageLocationDialog
        open={dialogOpen}
        editing={editing}
        onOpenChange={setDialogOpen}
        onSaved={() => fetchList(page)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="删除存储位置"
        description={
          <>
            确定要删除「{deleteTarget?.name}」吗？该操作不可恢复。已使用此位置上传的图片仍可访问，但无法再从此位置删除。
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
