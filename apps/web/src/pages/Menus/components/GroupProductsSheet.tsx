import { useCallback, useEffect, useRef, useState } from "react"
import { PackageIcon, GripVerticalIcon, LinkIcon, PencilIcon, ExternalLinkIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

import type { MenuProduct } from "@/api"
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TEXT_CLASSES } from "@dextea-admin/contracts/status"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"

const MIN_SHEET_WIDTH = 600
const MAX_SHEET_WIDTH_RATIO = 0.9
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { SelectPicker, type SelectOption } from "@/components/ui/select-picker"
import { getMenuGroupProducts, bindMenuProduct, batchRemoveMenuProducts, updateMenuProductSort, getProductOptions } from "@/api"

interface GroupProductsSheetProps {
  groupId: number
  groupName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GroupProductsSheet({
  groupId,
  groupName,
  open,
  onOpenChange,
}: GroupProductsSheetProps) {
  const navigate = useNavigate()
  const [products, setProducts] = useState<MenuProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetWidth, setSheetWidth] = useState(720)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const [bindOpen, setBindOpen] = useState(false)
  const [productOptions, setProductOptions] = useState<SelectOption[]>([])
  const [bindProductId, setBindProductId] = useState("")
  const [bindSortOrder, setBindSortOrder] = useState("0")
  const [binding, setBinding] = useState(false)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<MenuProduct | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [editingProduct, setEditingProduct] = useState<MenuProduct | null>(null)
  const [editSort, setEditSort] = useState("0")
  const [saving, setSaving] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isResizing.current = true
      startX.current = e.clientX
      startWidth.current = sheetWidth

      document.body.style.cursor = "ew-resize"
      document.body.style.userSelect = "none"

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current) return
        const diff = startX.current - moveEvent.clientX
        const panelWidth = startWidth.current + diff
        const maxWidth = window.innerWidth * MAX_SHEET_WIDTH_RATIO
        setSheetWidth(Math.max(MIN_SHEET_WIDTH, Math.min(panelWidth, maxWidth)))
      }

      const handleMouseUp = () => {
        isResizing.current = false
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [sheetWidth],
  )

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMenuGroupProducts(groupId)
      setProducts(res.data)
      setSelectedIds(new Set())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取分组商品失败")
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    if (open && groupId > 0) {
      fetchProducts()
    }
  }, [open, groupId, fetchProducts])

  useEffect(() => {
    if (bindOpen) {
      getProductOptions()
        .then((res) => {
          if (res.code === 0) setProductOptions(res.data)
        })
        .catch(() => {})
    }
  }, [bindOpen])

  const existingProductIds = products.map((p) => p.productId)
  const availableOptions = productOptions.filter((opt) => !existingProductIds.includes(Number(opt.value)))

  const allSelected = products.length > 0 && selectedIds.size === products.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < products.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map((p) => p.productId)))
    }
  }

  const toggleSelect = (productId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const openBindDialog = () => {
    setBindProductId("")
    setBindSortOrder("0")
    setBindOpen(true)
  }

  const handleBind = async () => {
    const productId = Number(bindProductId)
    if (!productId || productId <= 0) {
      toast.error("请选择商品")
      return
    }

    setBinding(true)
    try {
      const res = await bindMenuProduct(groupId, productId, Number(bindSortOrder) || 0)
      if (res.code === 0) {
        toast.success(res.message)
        setBindOpen(false)
        setBindProductId("")
        setBindSortOrder("0")
        await fetchProducts()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "绑定失败")
    } finally {
      setBinding(false)
    }
  }

  const openEditSort = (product: MenuProduct) => {
    setEditingProduct(product)
    setEditSort(String(product.sortOrder))
  }

  const handleUpdateSort = async () => {
    if (!editingProduct) return

    setSaving(true)
    try {
      const res = await updateMenuProductSort(groupId, editingProduct.productId, Number(editSort) || 0)
      if (res.code === 0) {
        toast.success(res.message)
        setEditingProduct(null)
        await fetchProducts()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新排序失败")
    } finally {
      setSaving(false)
    }
  }

  const openDeleteConfirm = (product: MenuProduct) => {
    setDeletingProduct(product)
    setDeleteConfirmOpen(true)
  }

  const handleUnbind = async () => {
    if (!deletingProduct) return

    setDeleting(true)
    try {
      const res = await batchRemoveMenuProducts(groupId, [deletingProduct.productId])
      if (res.code === 0) {
        toast.success(res.message)
        setDeleteConfirmOpen(false)
        setDeletingProduct(null)
        await fetchProducts()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "解绑失败")
    } finally {
      setDeleting(false)
    }
  }

  const handleBatchUnbind = async () => {
    if (selectedIds.size === 0) return

    setBatchDeleting(true)
    try {
      const res = await batchRemoveMenuProducts(groupId, Array.from(selectedIds))
      if (res.code === 0) {
        toast.success(res.message)
        setBatchDeleteOpen(false)
        setSelectedIds(new Set())
        await fetchProducts()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "批量解绑失败")
    } finally {
      setBatchDeleting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" style={{ width: sheetWidth, maxWidth: "none" }}>
        <SheetHeader>
          <SheetTitle>
            {groupName}的分组商品
          </SheetTitle>
        </SheetHeader>

        <div
          className="absolute left-0 top-0 z-20 flex h-full w-4 cursor-ew-resize items-center justify-center opacity-0 transition-opacity hover:opacity-100"
          onMouseDown={handleResizeStart}
        >
          <div className="flex h-8 w-0.5 items-center justify-center rounded-full bg-border">
            <GripVerticalIcon className="size-3 text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={openBindDialog}>
              <LinkIcon data-icon="inline-start" />
              绑定商品
            </Button>
            {selectedIds.size > 0 && (
              <Button
                variant="outline-destructive"
                size="sm"
                onClick={() => setBatchDeleteOpen(true)}
              >
                <Trash2Icon data-icon="inline-start" />
                批量解绑（{selectedIds.size}）
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="全选"
                    />
                  </TableHead>
                  <TableHead className="w-20">商品ID</TableHead>
                  <TableHead>商品名称</TableHead>
                  <TableHead className="w-24">价格</TableHead>
                  <TableHead className="w-24">全局状态</TableHead>
                  <TableHead className="w-20">排序</TableHead>
                  <TableHead className="w-48 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <Empty>
                        <EmptyMedia variant="icon">
                          <PackageIcon className="size-4" />
                        </EmptyMedia>
                        <EmptyTitle>暂无商品</EmptyTitle>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p.productId} data-state={selectedIds.has(p.productId) ? "selected" : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(p.productId)}
                          onCheckedChange={() => toggleSelect(p.productId)}
                          aria-label={`选择商品 ${p.productName ?? p.productId}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.productId}</TableCell>
                      <TableCell>{p.productName ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{p.price != null ? `¥ ${p.price.toFixed(2)}` : "-"}</TableCell>
                      <TableCell>
                        <span className={PRODUCT_STATUS_TEXT_CLASSES[p.status ?? -1] ?? ""}>
                          {PRODUCT_STATUS_LABEL[p.status ?? -1] ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.sortOrder}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/products/${p.productId}`)}
                          >
                            <ExternalLinkIcon data-icon="inline-start" />
                            查看商品
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditSort(p)}
                          >
                            <PencilIcon className="size-4" />
                            修改排序
                          </Button>
                          <Button
                            variant="outline-destructive"
                            size="sm"
                            onClick={() => openDeleteConfirm(p)}
                          >
                            <Trash2Icon data-icon="inline-start" />
                            解绑
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* 绑定商品对话框 */}
        <Dialog open={bindOpen} onOpenChange={setBindOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>绑定商品</DialogTitle>
              <DialogDescription>
                选择商品并设置排序值，绑定到分组「{groupName}」
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-2">
              <Field>
                <FieldLabel>选择商品</FieldLabel>
                <SelectPicker
                  options={availableOptions}
                  value={bindProductId}
                  onValueChange={setBindProductId}
                  placeholder="请选择商品"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="bind-sort">排序序号</FieldLabel>
                <Input
                  id="bind-sort"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={bindSortOrder}
                  onChange={(e) => setBindSortOrder(e.target.value)}
                />
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBindOpen(false)} disabled={binding}>
                取消
              </Button>
              <Button onClick={handleBind} disabled={binding}>
                {binding ? "绑定中..." : "确定"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 解绑确认对话框 */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="确认解绑"
          description={`确定要解除商品「${deletingProduct?.productName ?? "-"}」与分组「${groupName}」的绑定关系吗？`}
          confirmText="确认解绑"
          variant="destructive"
          loading={deleting}
          onConfirm={handleUnbind}
        />

        {/* 批量解绑确认对话框 */}
        <ConfirmDialog
          open={batchDeleteOpen}
          onOpenChange={setBatchDeleteOpen}
          title="确认批量解绑"
          description={`确定要解除已选中的 ${selectedIds.size} 个商品与分组「${groupName}」的绑定关系吗？`}
          confirmText="确认解绑"
          variant="destructive"
          loading={batchDeleting}
          onConfirm={handleBatchUnbind}
        />

        {/* 编辑排序对话框 */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => { if (!open) setEditingProduct(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑排序</DialogTitle>
              <DialogDescription>
                修改商品「{editingProduct?.productName ?? "-"}」在分组「{groupName}」中的排序
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-2">
              <Field>
                <FieldLabel htmlFor="edit-sort">排序序号</FieldLabel>
                <Input
                  id="edit-sort"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={editSort}
                  onChange={(e) => setEditSort(e.target.value)}
                />
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProduct(null)} disabled={saving}>
                取消
              </Button>
              <Button onClick={handleUpdateSort} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  )
}
