import { useCallback, useEffect, useState } from "react"
import { FlaskConicalIcon } from "lucide-react"
import { toast } from "sonner"

import type { StoreIngredientItem } from "@/api"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"
import { getStoreIngredients } from "@/api/store"

interface StoreIngredientStockPanelProps {
  storeId: number
}

export function StoreIngredientStockPanel({ storeId }: StoreIngredientStockPanelProps) {
  const [data, setData] = useState<StoreIngredientItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const fetchData = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getStoreIngredients(storeId, { page: targetPage, pageSize })
      if (res.code === 0) {
        setData(res.data.items)
        setTotal(res.data.total)
        setPage(targetPage)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取原料库存失败")
    } finally {
      setLoading(false)
    }
  }, [storeId, pageSize])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  return (
    <DataTable
      header={
        <TableHeader className="sticky top-0 z-50 bg-background">
          <TableRow>
            <TableHead>原料名称</TableHead>
            <TableHead className="w-28">单位</TableHead>
            <TableHead className="w-28 text-right">门店库存</TableHead>
          </TableRow>
        </TableHeader>
      }
      body={data.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.name}</TableCell>
          <TableCell className="font-mono text-xs">{item.unit}</TableCell>
          <TableCell className="text-right font-mono text-xs">{item.quantity}</TableCell>
        </TableRow>
      ))}
      loading={loading}
      isEmpty={data.length === 0}
      colSpan={3}
      hideRefresh
      emptyIcon={<FlaskConicalIcon className="size-4" />}
      emptyText="暂无数据"
      pagination={{ page, pageSize, total, onPageChange: fetchData }}
    />
  )
}
