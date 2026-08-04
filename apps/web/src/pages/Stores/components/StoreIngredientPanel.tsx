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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import DataTable from "@/components/ui/data-table"
import { getStoreIngredients, updateStoreIngredientStock } from "@/api/store"
import { logger, extractBackendMessage } from "@/lib/logger"

interface StoreIngredientPanelProps {
  storeId: number
}

export function StoreIngredientPanel({ storeId }: StoreIngredientPanelProps) {
  const [data, setData] = useState<StoreIngredientItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // 行内编辑状态：正在编辑的原料 ID 与草稿值
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<string>("")
  const [savingId, setSavingId] = useState<number | null>(null)

  const fetchData = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getStoreIngredients(storeId, { page: targetPage, pageSize })
      if (res.code === 0) {
        setData(res.data.items)
        setTotal(res.data.total)
        setPage(targetPage)
    }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "门店",
        label: "获取原料库存",
      })
      toast.error("获取原料库存失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [storeId, pageSize])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  const startEdit = (item: StoreIngredientItem) => {
    setEditingId(item.id)
    setDraft(String(item.quantity))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft("")
  }

  const saveEdit = async (item: StoreIngredientItem) => {
    const quantity = Number(draft)
    if (!Number.isFinite(quantity) || quantity < 0) {
      toast.error("库存必须为不小于 0 的数字")
      return
    }

    setSavingId(item.id)
    try {
      const res = await updateStoreIngredientStock(storeId, item.id, { quantity })
      if (res.code === 0) {
        setData((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, quantity: res.data.quantity } : it,
          ),
        )
        toast.success("库存已更新")
        setEditingId(null)
        setDraft("")
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "门店",
        label: "保存原料库存",
      })
      toast.error("更新库存失败，请稍后重试")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <DataTable
      header={
        <TableHeader className="sticky top-0 z-50 bg-background">
          <TableRow>
            <TableHead>原料名称</TableHead>
            <TableHead className="w-28">单位</TableHead>
            <TableHead className="w-40 text-right">门店库存</TableHead>
          </TableRow>
        </TableHeader>
      }
      body={data.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.name}</TableCell>
          <TableCell className="font-mono text-xs">{item.unit}</TableCell>
          <TableCell className="text-right font-mono text-xs">
            {editingId === item.id ? (
              <div className="flex items-center justify-end gap-2">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="h-8 w-24 text-right"
                />
                <Button
                  size="sm"
                  disabled={savingId === item.id}
                  onClick={() => saveEdit(item)}
                >
                  保存
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={savingId === item.id}
                  onClick={cancelEdit}
                >
                  取消
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="rounded px-1 hover:bg-muted"
                onClick={() => startEdit(item)}
                title="点击修改库存"
              >
                {item.quantity}
              </button>
            )}
          </TableCell>
        </TableRow>
      ))}
      loading={loading}
      isEmpty={data.length === 0}
      colSpan={3}
      hideRefresh
      hideToolbar
      emptyIcon={<FlaskConicalIcon className="size-4" />}
      emptyText="暂无数据"
      pagination={{ page, pageSize, total, onPageChange: fetchData }}
    />
  )
}
