import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LinkIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

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
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getBoundProducts, bindProduct, unbindProduct, updateBoundProductSort } from "@/services"

interface BoundProduct {
  productId: number
  productName: string
  sort: number
}

interface ProductBindingPanelProps {
  customizationId: number
}

export default function ProductBindingPanel({ customizationId }: ProductBindingPanelProps) {
  const navigate = useNavigate()
  const [products, setProducts] = useState<BoundProduct[]>([])
  const [loading, setLoading] = useState(true)

  const [bindOpen, setBindOpen] = useState(false)
  const [bindProductId, setBindProductId] = useState("")
  const [bindSort, setBindSort] = useState("0")
  const [binding, setBinding] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<BoundProduct | null>(null)
  const [editSort, setEditSort] = useState("0")
  const [editing, setEditing] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getBoundProducts(customizationId)
      if (res.code === 0) {
        setProducts(res.data)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取绑定的商品列表失败")
    } finally {
      setLoading(false)
    }
  }, [customizationId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleBind = async () => {
    const productId = Number(bindProductId)
    if (!productId || productId <= 0) {
      toast.error("请输入有效的商品ID")
      return
    }

    setBinding(true)
    try {
      const res = await bindProduct(customizationId, productId, Number(bindSort) || 0)
      if (res.code === 0) {
        toast.success(res.message)
        setBindOpen(false)
        setBindProductId("")
        setBindSort("0")
        await fetchProducts()
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
    try {
      const res = await unbindProduct(customizationId, productId)
      if (res.code === 0) {
        toast.success(res.message)
        await fetchProducts()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? (err instanceof Error ? err.message : "解绑失败"))
    }
  }

  const openEditDialog = (product: BoundProduct) => {
    setEditProduct(product)
    setEditSort(String(product.sort))
    setEditOpen(true)
  }

  const handleEditSort = async () => {
    if (!editProduct) return

    setEditing(true)
    try {
      const res = await updateBoundProductSort(customizationId, editProduct.productId, Number(editSort) || 0)
      if (res.code === 0) {
        toast.success(res.message)
        setEditOpen(false)
        setEditProduct(null)
        await fetchProducts()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? (err instanceof Error ? err.message : "更新排序失败"))
    } finally {
      setEditing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <Dialog open={bindOpen} onOpenChange={setBindOpen}>
            <DialogTrigger render={<Button><LinkIcon data-icon="inline-start" />绑定新商品</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>绑定新商品</DialogTitle>
              <DialogDescription>输入商品ID和排序序号即可将商品绑定到该客制化项目</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">商品ID</label>
                <Input
                  placeholder="输入商品ID"
                  value={bindProductId}
                  onChange={(e) => setBindProductId(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">排序序号</label>
                <Input
                  placeholder="默认 0"
                  value={bindSort}
                  onChange={(e) => setBindSort(e.target.value)}
                />
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
        {!loading && <span className="text-sm text-muted-foreground">共 {products.length} 个商品</span>}
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          加载中...
        </div>
      ) : products.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <LinkIcon className="size-4" />
          </EmptyMedia>
          <EmptyTitle>暂未绑定商品</EmptyTitle>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">商品ID</TableHead>
              <TableHead>商品名称</TableHead>
              <TableHead className="w-20">排序</TableHead>
              <TableHead className="w-48 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.productId}>
                <TableCell className="font-mono text-xs">{p.productId}</TableCell>
                <TableCell>{p.productName}</TableCell>
                <TableCell className="font-mono text-xs">{p.sort}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/products/${p.productId}`)}>
                      <LinkIcon data-icon="inline-start" />
                      查看商品
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(p)}>
                      <PencilIcon data-icon="inline-start" />
                      排序
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-500"
                      onClick={() => handleUnbind(p.productId)}
                    >
                      <Trash2Icon className="size-4" data-icon="inline-start" />
                      解绑
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑排序</DialogTitle>
            <DialogDescription>
              修改当前客制化项目在商品「{editProduct?.productName}」中的排序序号
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">排序序号</label>
              <Input
                placeholder="排序序号"
                value={editSort}
                onChange={(e) => setEditSort(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button onClick={handleEditSort} disabled={editing}>
              {editing ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
