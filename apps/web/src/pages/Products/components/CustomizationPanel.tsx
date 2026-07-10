import { useCallback, useEffect, useState } from "react"
import { ListIcon, PencilIcon, PlusIcon, SettingsIcon } from "lucide-react"
import { toast } from "sonner"

import type { Customization } from "@/api"
import { CUSTOMIZATION_STATUS } from "@/lib/status"
import { CUSTOMIZATION_STATUS_LABEL, CUSTOMIZATION_STATUS_TEXT_CLASSES } from "@/lib/status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  getCustomizations,
  createCustomization,
  updateCustomizationStatus,
} from "@/api"
import { EditCustomizationDialog } from "./EditCustomizationDialog"
import ManageOptionsSheet from "./ManageOptionsSheet"

interface CustomizationPanelProps {
  productId: number
}

const pageSize = 20

export default function CustomizationPanel({ productId }: CustomizationPanelProps) {
  const [data, setData] = useState<Customization[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Manage options sheet
  const [manageSheetOpen, setManageSheetOpen] = useState(false)
  const [managingItem, setManagingItem] = useState<Customization | null>(null)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Customization | null>(null)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [creating, setCreating] = useState(false)

  const fetchData = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getCustomizations({
        productId,
        page: targetPage,
        pageSize,
      })
      if (res.code === 0) {
        setData(res.data.items)
        setTotal(res.data.total)
        setPage(targetPage)
        setManageSheetOpen(false)
        setManagingItem(null)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取客制化项目列表失败")
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  // ── Create ──
  const handleCreate = async () => {
    if (!createName.trim()) {
      toast.error("请输入项目名称")
      return
    }
    setCreating(true)
    try {
      const res = await createCustomization({
        productId,
        name: createName.trim(),
      })
      if (res.code === 0) {
        toast.success(res.message)
        setCreateOpen(false)
        setCreateName("")
        await fetchData(1)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败")
    } finally {
      setCreating(false)
    }
  }

  const colCount = 4

  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [toggleConfirmItem, setToggleConfirmItem] = useState<Customization | null>(null)
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false)

  const handleToggleStatus = async (item: Customization) => {
    setToggleConfirmItem(item)
    setToggleConfirmOpen(true)
  }

  const confirmToggleStatus = async () => {
    if (!toggleConfirmItem) return
    const item = toggleConfirmItem
    setTogglingId(item.id)
    setToggleConfirmOpen(false)
    setToggleConfirmItem(null)
    try {
      const newStatus = item.status === CUSTOMIZATION_STATUS.OFF.value
        ? CUSTOMIZATION_STATUS.ON.value
        : CUSTOMIZATION_STATUS.OFF.value
      const res = await updateCustomizationStatus(item.id, newStatus)
      if (res.code === 0) {
        toast.success(res.message)
        await fetchData(page)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新状态失败")
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          新建项目
        </Button>
        {!loading && <span className="text-sm text-muted-foreground">共 {total} 个项目</span>}
      </div>

      {/* Table (always rendered) */}
      <ScrollArea className="max-h-[calc(100vh-480px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>项目名称</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-20">选项数</TableHead>
              <TableHead className="w-80 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-48 text-center">
                  <Spinner className="mx-auto size-6 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-48 text-center">
                  <Empty>
                    <EmptyMedia variant="icon">
                      <ListIcon className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>暂无数据</EmptyTitle>
                    <Button onClick={() => setCreateOpen(true)}>
                      立即添加
                    </Button>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <span className={CUSTOMIZATION_STATUS_TEXT_CLASSES[item.status] ?? ""}>
                        {CUSTOMIZATION_STATUS_LABEL[item.status]}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.optionCount ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant={item.status === CUSTOMIZATION_STATUS.OFF.value ? "outline-success" : "outline-destructive"}
                          size="sm"
                          onClick={() => handleToggleStatus(item)}
                          disabled={togglingId === item.id}
                        >
                          {item.status === CUSTOMIZATION_STATUS.OFF.value ? "转激活" : "转禁用"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingItem(item)
                            setEditOpen(true)
                          }}
                        >
                          <PencilIcon className="size-4" data-icon="inline-start" />
                          重命名
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setManagingItem(item)
                            setManageSheetOpen(true)
                          }}
                        >
                          <SettingsIcon className="size-4" data-icon="inline-start" />
                          管理选项
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Pagination (only when data exists) */}
      {!loading && data.length > 0 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  if (page > 1) fetchData(page - 1)
                }}
                text="上一页"
              />
            </PaginationItem>
            {(() => {
              const totalPages = Math.ceil(total / pageSize)
              const pages: (number | "...")[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (page > 3) pages.push("...")
                for (
                  let i = Math.max(2, page - 1);
                  i <= Math.min(totalPages - 1, page + 1);
                  i++
                ) {
                  pages.push(i)
                }
                if (page < totalPages - 2) pages.push("...")
                pages.push(totalPages)
              }
              return pages.map((p, idx) =>
                p === "..." ? (
                  <PaginationItem key={`e-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault()
                        fetchData(p)
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )
            })()}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  if (page < Math.ceil(total / pageSize)) fetchData(page + 1)
                }}
                text="下一页"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建客制化项目</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field>
              <FieldLabel htmlFor="create-name">
                项目名称 <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="create-name"
                placeholder="例如：温度、甜度、加料"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate()
                }}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "创建中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      {editingItem && (
        <EditCustomizationDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open)
            if (!open) setEditingItem(null)
          }}
          item={editingItem}
          onUpdated={() => fetchData(page)}
        />
      )}

      {/* ── Manage Options Sheet ── */}
      {managingItem && (
        <ManageOptionsSheet
          customizationId={managingItem.id}
          customizationName={managingItem.name}
          open={manageSheetOpen}
          onOpenChange={(open) => {
            setManageSheetOpen(open)
            if (!open) setManagingItem(null)
          }}
        />
      )}

      {/* ── Toggle Status Confirm Dialog ── */}
      <Dialog open={toggleConfirmOpen} onOpenChange={setToggleConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认切换状态</DialogTitle>
            <DialogDescription>
              确定将「{toggleConfirmItem?.name}」项目{toggleConfirmItem?.status === CUSTOMIZATION_STATUS.OFF.value ? "激活" : "禁用"}吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button onClick={confirmToggleStatus} disabled={togglingId !== null}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
