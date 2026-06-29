import { Fragment, useCallback, useEffect, useState } from "react"
import { ChevronDownIcon, ChevronRightIcon, ListIcon, PencilIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import type { ProductCustomization } from "@dextea/shared-types"
import { PRODUCT_CUSTOMIZATION_STATUS } from "@dextea/shared-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { StatusSelectPicker } from "@/components/ui/status-select-picker"
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  getProductCustomizations,
  createProductCustomization,
  updateProductCustomization,
} from "@/services"
import CustomizationOptionsPanel from "./CustomizationOptionsPanel"

interface CustomizationPanelProps {
  productId: number
}

const pageSize = 20

export default function CustomizationPanel({ productId }: CustomizationPanelProps) {
  const [data, setData] = useState<ProductCustomization[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Expanded inline options panel
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [creating, setCreating] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductCustomization | null>(null)
  const [editName, setEditName] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getProductCustomizations({
        productId,
        page: targetPage,
        pageSize,
      })
      if (res.code === 0) {
        setData(res.data.items)
        setTotal(res.data.total)
        setPage(targetPage)
        setExpandedId(null)
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
      const res = await createProductCustomization({
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

  // ── Edit ──
  const openEdit = (item: ProductCustomization) => {
    setEditingItem(item)
    setEditName(item.name)
    setEditStatus(String(item.status))
    setEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingItem) return
    if (!editName.trim()) {
      toast.error("请输入项目名称")
      return
    }
    setSaving(true)
    try {
      const res = await updateProductCustomization(editingItem.id, {
        name: editName.trim(),
        status: Number(editStatus) as ProductCustomization["status"],
      })
      if (res.code === 0) {
        toast.success(res.message)
        setEditOpen(false)
        setEditingItem(null)
        await fetchData(page)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败")
    } finally {
      setSaving(false)
    }
  }

  const colCount = 4

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
              <TableHead className="w-52 text-right">操作</TableHead>
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
                <Fragment key={item.id}>
                  <TableRow>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.status === PRODUCT_CUSTOMIZATION_STATUS.OFF.value
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30"
                        }
                      >
                        {item.status === PRODUCT_CUSTOMIZATION_STATUS.OFF.value ? "下架" : "启用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.optionCount ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        >
                          {expandedId === item.id ? (
                            <ChevronDownIcon className="size-4" data-icon="inline-start" />
                          ) : (
                            <ChevronRightIcon className="size-4" data-icon="inline-start" />
                          )}
                          选项管理
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === item.id && (
                    <TableRow>
                      <TableCell colSpan={colCount} className="bg-muted/30 p-4">
                        <CustomizationOptionsPanel customizationId={item.id} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
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
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑客制化项目</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field>
              <FieldLabel htmlFor="edit-name">
                项目名称 <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate()
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-status">状态</FieldLabel>
              <StatusSelectPicker
                statusEnum={PRODUCT_CUSTOMIZATION_STATUS}
                labels={{
                  [PRODUCT_CUSTOMIZATION_STATUS.OFF.value]: "下架",
                  [PRODUCT_CUSTOMIZATION_STATUS.ON.value]: "启用",
                }}
                value={editStatus}
                onValueChange={(v) => setEditStatus(v)}
                placeholder="请选择状态"
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
