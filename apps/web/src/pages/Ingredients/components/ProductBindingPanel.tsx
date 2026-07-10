import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LinkIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import type { PaginatedData } from "@/api"
import { Button } from "@/components/ui/button"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { SelectPicker } from "@/components/ui/select-picker"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { getIngredientBoundProducts, bindProductToIngredient, updateIngredientProductQuantity, unbindProductFromIngredient, getProductOptions } from "@/api"

interface BoundProduct {
  productId: number
  productName: string
  quantity: number
}

interface ProductBindingPanelProps {
  ingredientId: number
  unit: string
}

export default function ProductBindingPanel({ ingredientId, unit }: ProductBindingPanelProps) {
  const navigate = useNavigate()
  const [products, setProducts] = useState<BoundProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const [bindOpen, setBindOpen] = useState(false)
  const [bindProductId, setBindProductId] = useState("")
  const [bindQuantity, setBindQuantity] = useState("0")
  const [binding, setBinding] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<BoundProduct | null>(null)
  const [editQuantity, setEditQuantity] = useState("0")
  const [editing, setEditing] = useState(false)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BoundProduct | null>(null)

  const [productOptions, setProductOptions] = useState<{ label: string; value: string }[]>([])

  const fetchProducts = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getIngredientBoundProducts(ingredientId, { page: targetPage, pageSize })
      if (res.code === 0) {
        const data = res.data as PaginatedData<BoundProduct>
        setProducts(data.items)
        setTotal(data.total)
        setPage(targetPage)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取绑定的商品列表失败")
    } finally {
      setLoading(false)
    }
  }, [ingredientId, pageSize])

  useEffect(() => {
    fetchProducts(1)
  }, [fetchProducts])

  useEffect(() => {
    getProductOptions().then((res) => {
      if (res.code === 0) setProductOptions(res.data)
    }).catch(() => {})
  }, [])

  const handleBind = async () => {
    const productId = Number(bindProductId)
    if (!productId || productId <= 0) {
      toast.error("请选择商品")
      return
    }

    setBinding(true)
    try {
      const res = await bindProductToIngredient(ingredientId, productId, Number(bindQuantity) || 0)
      if (res.code === 0) {
        toast.success(res.message)
        setBindOpen(false)
        setBindProductId("")
        setBindQuantity("0")
        await fetchProducts(1)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? (err instanceof Error ? err.message : "绑定失败"))
    } finally {
      setBinding(false)
    }
  }

  const handleUnbind = async (productId: number) => {
    setBinding(true)
    try {
      const res = await unbindProductFromIngredient(ingredientId, productId)
      if (res.code === 0) {
        toast.success(res.message)
        await fetchProducts(page)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? (err instanceof Error ? err.message : "解绑失败"))
    } finally {
      setBinding(false)
    }
  }

  const openUnbindConfirm = (product: BoundProduct) => {
    setDeleteTarget(product)
    setDeleteConfirmOpen(true)
  }

  const openEditDialog = (product: BoundProduct) => {
    setEditProduct(product)
    setEditQuantity(String(product.quantity))
    setEditOpen(true)
  }

  const handleEditQuantity = async () => {
    if (!editProduct) return

    setEditing(true)
    try {
      const res = await updateIngredientProductQuantity(ingredientId, editProduct.productId, Number(editQuantity) || 0)
      if (res.code === 0) {
        toast.success(res.message)
        setEditOpen(false)
        setEditProduct(null)
        await fetchProducts(page)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? (err instanceof Error ? err.message : "更新用量失败"))
    } finally {
      setEditing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <Dialog open={bindOpen} onOpenChange={setBindOpen}>
            <DialogTrigger render={<Button><LinkIcon data-icon="inline-start" />绑定商品</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>绑定新商品</DialogTitle>
                <DialogDescription>选择商品并设置用量即可将商品绑定到该原料</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">商品 <span className="text-red-500">*</span></label>
                  <SelectPicker
                    options={productOptions}
                    value={bindProductId}
                    onValueChange={setBindProductId}
                    placeholder="请选择商品"
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">用量 <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="默认 0"
                      value={bindQuantity}
                      onChange={(e) => setBindQuantity(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground shrink-0">{unit}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">取消</Button>} />
                <Button onClick={handleBind} disabled={binding}>
                  {binding ? "绑定中..." : "确定"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {!loading && <span className="text-sm text-muted-foreground">共 {total} 个商品</span>}
      </div>

      <ScrollArea className="max-h-[calc(100vh-480px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">商品ID</TableHead>
              <TableHead>商品名称</TableHead>
              <TableHead className="w-24">用量（{unit}）</TableHead>
              <TableHead className="w-56 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <Empty>
                    <EmptyMedia variant="icon">
                      <LinkIcon className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>暂无数据</EmptyTitle>
                    <Button onClick={() => setBindOpen(true)}>
                      立即添加
                    </Button>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.productId}>
                  <TableCell className="font-mono text-xs">{p.productId}</TableCell>
                  <TableCell>{p.productName}</TableCell>
                  <TableCell className="font-mono text-xs">{p.quantity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/products/${p.productId}`)}>
                        <LinkIcon data-icon="inline-start" />
                        查看商品
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(p)}>
                        <PencilIcon data-icon="inline-start" />
                        编辑
                      </Button>
                      <Button
                        variant="outline-destructive"
                        size="sm"
                        onClick={() => openUnbindConfirm(p)}
                      >
                        <Trash2Icon className="size-4" data-icon="inline-start" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Pagination */}
      {!loading && products.length > 0 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  if (page > 1) fetchProducts(page - 1)
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
                        fetchProducts(p)
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
                  if (page < Math.ceil(total / pageSize)) fetchProducts(page + 1)
                }}
                text="下一页"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用量</DialogTitle>
            <DialogDescription>
              修改该原料在商品「{editProduct?.productName}」中的用量
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">用量</label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="用量"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                />
                <span className="text-sm text-muted-foreground shrink-0">{unit}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button onClick={handleEditQuantity} disabled={editing}>
              {editing ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认解绑</DialogTitle>
            <DialogDescription>
              确定要将原料与商品「{deleteTarget?.productName}」解除绑定吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleteTarget) await handleUnbind(deleteTarget.productId)
                setDeleteConfirmOpen(false)
                setDeleteTarget(null)
              }}
              disabled={binding}
            >
              {binding ? "解绑中..." : "确认解绑"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
