import { useCallback, useState } from "react"
import { PackageIcon } from "lucide-react"
import { toast } from "sonner"

import type { IngredientProduct, PaginatedData } from "@/api"
import { getIngredientBoundProducts } from "@/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"

interface BoundProductsDialogProps {
  ingredientId: number
  ingredientName: string
  unit: string
  count: number
}

/** 只读弹窗：查看哪些商品绑定了该原料（不允许在原料侧写入） */
export default function BoundProductsDialog({
  ingredientId,
  ingredientName,
  unit,
  count,
}: BoundProductsDialogProps) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<IngredientProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const fetchProducts = useCallback(
    async (targetPage: number) => {
      setLoading(true)
      try {
        const res = await getIngredientBoundProducts(ingredientId, {
          page: targetPage,
          pageSize,
        })
        if (res.code === 0) {
          const data = res.data as PaginatedData<IngredientProduct>
          setProducts(data.items)
          setTotal(data.total)
          setPage(targetPage)
        } else {
          toast.error(res.message)
        }
      } catch {
        toast.error("获取绑定商品列表失败")
      } finally {
        setLoading(false)
      }
    },
    [ingredientId, pageSize],
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          fetchProducts(1)
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="link" size="sm" className="h-auto p-0">
            {count} 个商品
          </Button>
        }
      />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>绑定到「{ingredientName}」的商品</DialogTitle>
          <DialogDescription>
            以下商品已绑定该原料（只读展示，如需调整用量或排序请到对应商品页）
          </DialogDescription>
        </DialogHeader>

        <DataTable
          header={
            <TableHeader className="sticky top-0 z-50 bg-background">
              <TableRow>
                <TableHead className="w-24">商品ID</TableHead>
                <TableHead>商品名称</TableHead>
                <TableHead className="w-28">用量</TableHead>
                <TableHead className="w-20">排序</TableHead>
              </TableRow>
            </TableHeader>
          }
          body={products.map((item) => (
            <TableRow key={item.productId}>
              <TableCell className="font-mono text-xs">{item.productId}</TableCell>
              <TableCell>{item.productName}</TableCell>
              <TableCell className="font-mono text-xs">
                {item.quantity} {unit}
              </TableCell>
              <TableCell className="font-mono text-xs">{item.sort}</TableCell>
            </TableRow>
          ))}
          loading={loading}
          isEmpty={products.length === 0}
          colSpan={4}
          hideRefresh
          emptyIcon={<PackageIcon className="size-4" />}
          emptyText="暂无商品绑定"
          pagination={{ page, pageSize, total, onPageChange: fetchProducts }}
        />

        <div className="flex justify-end">
          <DialogClose render={<Button variant="outline">关闭</Button>} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
