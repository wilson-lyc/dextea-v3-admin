import { useCallback, useEffect, useState } from "react"
import { PackageIcon } from "lucide-react"
import { toast } from "sonner"

import type { IngredientProduct, PaginatedData } from "@/api"
import { getIngredientBoundProducts } from "@/api"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"

interface RelatedProductPanelProps {
  ingredientId: number
  unit: string
}

/** 只读面板：展示绑定了该原料的商品（绑定 / 用量 / 排序均在商品侧维护） */
export default function RelatedProductPanel({ ingredientId, unit }: RelatedProductPanelProps) {
  const [products, setProducts] = useState<IngredientProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const fetchProducts = useCallback(async (targetPage: number) => {
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
  }, [ingredientId, pageSize])

  useEffect(() => {
    fetchProducts(1)
  }, [fetchProducts])

  return (
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
      emptyIcon={<PackageIcon className="size-4" />}
      emptyText="暂无商品绑定该原料"
      pagination={{ page, pageSize, total, onPageChange: fetchProducts }}
    />
  )
}
