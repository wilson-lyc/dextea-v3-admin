import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ExternalLinkIcon, PackageIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { SelectPicker, type SelectOption } from "@/components/ui/select-picker"
import { getTagBoundProducts, bindProductToTag, unbindProductFromTag, getProductOptions } from "@/services"

interface ProductBindingSheetProps {
  tagId: number
  tagName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ProductBindingSheet({
  tagId,
  tagName,
  open,
  onOpenChange,
}: ProductBindingSheetProps) {
  const navigate = useNavigate()

  const [products, setProducts] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // Bind dialog state
  const [bindOpen, setBindOpen] = useState(false)
  const [productOptions, setProductOptions] = useState<SelectOption[]>([])
  const [bindProductId, setBindProductId] = useState("")
  const [binding, setBinding] = useState(false)

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<{ id: number; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProducts = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getTagBoundProducts(tagId, { page: targetPage, pageSize })
      setProducts(res.data.items)
      setTotal(res.data.total)
      setPage(res.data.page)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取绑定商品列表失败")
    } finally {
      setLoading(false)
    }
  }, [tagId])

  useEffect(() => {
    if (open) {
      fetchProducts(1)
    }
  }, [open, fetchProducts])

  // Load product options when bind dialog opens
  useEffect(() => {
    if (bindOpen) {
      getProductOptions()
        .then((res) => {
          if (res.code === 0) setProductOptions(res.data)
        })
        .catch(() => {})
    }
  }, [bindOpen])

  const handleBind = async () => {
    const productId = Number(bindProductId)
    if (!productId || productId <= 0) {
      toast.error("请选择商品")
      return
    }

    setBinding(true)
    try {
      const res = await bindProductToTag(tagId, productId)
      if (res.code === 0) {
        toast.success(res.message)
        setBindOpen(false)
        setBindProductId("")
        await fetchProducts(1)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "绑定失败")
    } finally {
      setBinding(false)
    }
  }

  const openBindDialog = () => {
    setBindProductId("")
    setBindOpen(true)
  }

  // Open delete confirmation
  const openDeleteConfirm = (product: { id: number; name: string }) => {
    setDeletingProduct(product)
    setDeleteConfirmOpen(true)
  }

  // Handle unbind
  const handleUnbind = async () => {
    if (!deletingProduct) return

    setDeleting(true)
    try {
      const res = await unbindProductFromTag(tagId, deletingProduct.id)
      if (res.code === 0) {
        toast.success(res.message)
        setDeleteConfirmOpen(false)
        setDeletingProduct(null)
        await fetchProducts(1)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "解绑失败")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            商品绑定 — {tagName}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Bind button */}
          <div className="flex items-center justify-end">
            <Button size="sm" onClick={openBindDialog}>
              <PlusIcon data-icon="inline-start" />
              绑定商品
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>商品名称</TableHead>
                    <TableHead className="w-48 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-48 text-center">
                        <Empty>
                          <EmptyMedia variant="icon">
                            <PackageIcon className="size-4" />
                          </EmptyMedia>
                          <EmptyTitle>暂无绑定商品</EmptyTitle>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-xs">{product.id}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/products/${product.id}`)}
                            >
                              <ExternalLinkIcon data-icon="inline-start" />
                              查看商品
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-500"
                              onClick={() => openDeleteConfirm(product)}
                            >
                              <Trash2Icon data-icon="inline-start" />
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {products.length > 0 && (
                <Pagination className="justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page > 1) fetchProducts(page - 1) }}
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
                        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
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
                              onClick={(e: React.MouseEvent) => { e.preventDefault(); fetchProducts(p) }}
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
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page < Math.ceil(total / pageSize)) fetchProducts(page + 1) }}
                        text="下一页"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>

        {/* Bind product dialog */}
        <Dialog open={bindOpen} onOpenChange={setBindOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>绑定商品</DialogTitle>
              <DialogDescription>
                选择一个商品绑定到标签「{tagName}」
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <SelectPicker
                options={productOptions}
                value={bindProductId}
                onValueChange={setBindProductId}
                placeholder="请选择商品"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBindOpen(false)}
                disabled={binding}
              >
                取消
              </Button>
              <Button onClick={handleBind} disabled={binding}>
                {binding ? "绑定中..." : "确定"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认解绑</DialogTitle>
              <DialogDescription>
                确定要解除商品「{deletingProduct?.name}」与标签「{tagName}」的绑定关系吗？
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleUnbind}
                disabled={deleting}
              >
                {deleting ? "解绑中..." : "确认解绑"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  )
}
