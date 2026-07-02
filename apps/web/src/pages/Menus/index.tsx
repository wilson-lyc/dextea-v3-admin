import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PlusIcon, Settings, ClipboardListIcon, RotateCwIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import type { Menu } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import PaginationBar from "@/components/ui/pagination-bar"
import { getMenus, batchDeleteMenus } from "@/services"
import CreateMenuDialog from "./components/CreateMenuDialog"
import ConfirmDialog from "@/components/ui/confirm-dialog"

export default function MenusPage() {
  const navigate = useNavigate()

  // 列表数据与分页状态
  const [items, setItems] = useState<Menu[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20

  // UI 状态
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // 获取菜单列表
  const fetchMenus = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const params = { page: targetPage, pageSize }
      const res = await getMenus(params)
      if (res.code === 0) {
        setItems(res.data.items)
        setTotal(res.data.total)
        setPage(targetPage)
        setSelectedIds(new Set())
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      console.error(err)
      toast.error("数据加载异常")
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  // 初始加载第一页
  useEffect(() => {
    fetchMenus(1)
  }, [fetchMenus])

  // 勾选/取消勾选单个菜单
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)))
    }
  }

  // 打开确认弹窗
  const handleBatchDeleteClick = () => {
    if (selectedIds.size === 0) return
    setDeleteError(null)
    setConfirmDialogOpen(true)
  }

  // 执行批量删除
  const handleBatchDeleteConfirm = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await batchDeleteMenus(Array.from(selectedIds))
      if (res.code === 0) {
        setConfirmDialogOpen(false)
        toast.success(`成功删除 ${selectedIds.size} 个菜单`)
        fetchMenus(page)
      } else {
        setDeleteError(res.message)
      }
    } catch (err) {
      console.error(err)
      setDeleteError("批量删除异常")
    } finally {
      setDeleting(false)
    }
  }

  const allSelected = items.length > 0 && selectedIds.size === items.length

  return (
    <div className="flex h-full flex-col gap-4 p-6">

      {/* 顶栏：新建、批量删除与刷新 */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            新建菜单
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="destructive" onClick={handleBatchDeleteClick} disabled={deleting}>
              <Trash2Icon data-icon="inline-start" />
              删除选中 ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => { setLoading(true); setTimeout(() => fetchMenus(page), 1000) }}>
            <RotateCwIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* 菜单表格 */}
      <div className="flex flex-1 flex-col overflow-auto rounded-lg border">
        <Table className={`base-class ${(items.length === 0 || loading) && 'flex-1'}`}>
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <TableHead className="w-24">菜单ID</TableHead>
              <TableHead className="w-44">菜单名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="w-44">创建时间</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="h-96">
                  <div className="flex items-center justify-center">
                    <Spinner className="size-6 text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : items.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="h-96">
                  <div className="flex items-center justify-center">
                    <Empty>
                      <EmptyMedia variant="icon">
                        <ClipboardListIcon className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>暂无数据</EmptyTitle>
                    </Empty>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell>{item.name || "—"}</TableCell>
                  <TableCell>{item.description || "—"}</TableCell>
                  <TableCell>{item.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/menus/${item.id}`)}>
                      <Settings data-icon="inline-start" />
                      管理
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      {/* 分页 */}
      {items.length > 0 && (
        <PaginationBar
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={fetchMenus}
          className="shrink-0 justify-end"
        />
      )}

      {/* 新建菜单对话框 */}
      <CreateMenuDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => fetchMenus(page)}
      />

      {/* 批量删除确认弹窗 */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="确认删除"
        description={
          <>
            确定要删除选中的 <span className="font-semibold text-foreground">{selectedIds.size}</span> 个菜单吗？已被门店绑定的菜单无法删除。
          </>
        }
        confirmText="删除"
        variant="destructive"
        loading={deleting}
        errorMessage={deleteError}
        onConfirm={handleBatchDeleteConfirm}
      />

    </div>
  )
}
