import { useCallback, useEffect, useState } from "react"
import { LinkIcon } from "lucide-react"
import { toast } from "sonner"

import type { IngredientOption, PaginatedData } from "@/api"
import { getIngredientBoundOptions } from "@/api"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"

interface RelatedCustomizationOptionPanelProps {
  ingredientId: number
  unit: string
}

/** 只读面板：展示引用了该原料的客制化选项（绑定 / 用量均在客制化选项侧维护） */
export default function RelatedCustomizationOptionPanel({
  ingredientId,
  unit,
}: RelatedCustomizationOptionPanelProps) {
  const [options, setOptions] = useState<IngredientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const fetchOptions = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getIngredientBoundOptions(ingredientId, {
        page: targetPage,
        pageSize,
      })
      if (res.code === 0) {
        const data = res.data as PaginatedData<IngredientOption>
        setOptions(data.items)
        setTotal(data.total)
        setPage(targetPage)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取绑定的客制化选项列表失败")
    } finally {
      setLoading(false)
    }
  }, [ingredientId, pageSize])

  useEffect(() => {
    fetchOptions(1)
  }, [fetchOptions])

  return (
    <DataTable
      header={
        <TableHeader className="sticky top-0 z-50 bg-background">
          <TableRow>
            <TableHead className="w-24">选项ID</TableHead>
            <TableHead>选项名称</TableHead>
            <TableHead>所属客制化</TableHead>
            <TableHead className="w-28">用量</TableHead>
          </TableRow>
        </TableHeader>
      }
      body={options.map((o) => (
        <TableRow key={o.optionId}>
          <TableCell className="font-mono text-xs">{o.optionId}</TableCell>
          <TableCell>{o.optionName}</TableCell>
          <TableCell>{o.customizationName}</TableCell>
          <TableCell className="font-mono text-xs">
            {o.quantity} {unit}
          </TableCell>
        </TableRow>
      ))}
      loading={loading}
      isEmpty={options.length === 0}
      colSpan={4}
      hideToolbar
      hideRefresh
      emptyIcon={<LinkIcon className="size-4" />}
      emptyText="暂无客制化选项引用该原料"
      pagination={{ page, pageSize, total, onPageChange: fetchOptions }}
    />
  )
}
