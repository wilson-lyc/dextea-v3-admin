import { useCallback, useEffect, useMemo, useState } from "react"
import { PackageIcon, AlertTriangleIcon } from "lucide-react"
import { toast } from "sonner"

import type { StoreProductItem } from "@/api"
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TEXT_CLASSES, STORE_PRODUCT_STATUS_LABEL, STORE_PRODUCT_STATUS_TEXT_CLASSES, getProductFinalStatus } from "@dextea-admin/contracts/status"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getStoreProducts, updateProductStoreStatus } from "@/api/store"

interface StoreProductsPanelProps {
  storeId: number
}

export function StoreProductsPanel({ storeId }: StoreProductsPanelProps) {
  const [data, setData] = useState<StoreProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [globalFilter, setGlobalFilter] = useState("")
  const [storeFilter, setStoreFilter] = useState("")
  const [finalFilter, setFinalFilter] = useState("")
  const pageSize = 20

  const fetchData = useCallback(
    async (targetPage: number) => {
      setLoading(true)
      try {
        const params: Record<string, string | number> = {
          page: targetPage,
          pageSize,
        }

        if (finalFilter === "下架") {
          params.globalStatus = "0"
        } else if (finalFilter === "售罄") {
          params.globalStatus = "1"
          params.storeStatus = "0"
        } else if (finalFilter === "可售") {
          params.globalStatus = "1"
          params.storeStatus = "1"
        } else {
          if (globalFilter) params.globalStatus = globalFilter
          if (storeFilter) params.storeStatus = storeFilter
        }

        const res = await getStoreProducts(storeId, params)
        if (res.code === 0) {
          setData(res.data.items)
          setTotal(res.data.total)
          setPage(targetPage)
        } else {
          toast.error(res.message)
        }
      } catch {
        toast.error("获取商品列表失败")
      } finally {
        setLoading(false)
      }
    },
    [storeId, globalFilter, storeFilter, finalFilter],
  )

  // Re-fetch when filters change, resetting to page 1
  useEffect(() => {
    fetchData(1)
  }, [globalFilter, storeFilter, finalFilter])

  const [toggleTarget, setToggleTarget] = useState<{
    id: number
    name: string
    currentStatus: number
  } | null>(null)

  const handleToggleConfirm = useCallback(async () => {
    if (!toggleTarget) return
    const { id, currentStatus } = toggleTarget
    const newStatus =
      currentStatus === 1 ? 0 : 1

    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, storeStatus: newStatus } : item,
      ),
    )
    setToggleTarget(null)

    try {
      const res = await updateProductStoreStatus(storeId, id, {
        status: newStatus,
      })
      if (res.code !== 0) {
        setData((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, storeStatus: currentStatus }
              : item,
          ),
        )
        toast.error(res.message)
      }
    } catch {
      setData((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, storeStatus: currentStatus }
            : item,
        ),
      )
      toast.error("更新商品门店状态失败")
    }
  }, [storeId, toggleTarget])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  const stats = useMemo(() => {
    let available = 0
    let soldOut = 0
    let offShelf = 0
    for (const item of data) {
      if (item.globalStatus === 0) {
        offShelf++
      } else if (item.storeStatus === 0) {
        soldOut++
      } else {
        available++
      }
    }
    return { available, soldOut, offShelf }
  }, [data])

  return (
    <>
      <DataTable
      toolbarLeft={
        <div className="flex items-center gap-4 text-sm">
          <span>
            可售 <strong className="text-green-700 dark:text-green-400">{stats.available}</strong>
          </span>
          <span className="text-muted-foreground">/</span>
          <span>
            售罄 <strong className="text-red-700 dark:text-red-400">{stats.soldOut}</strong>
          </span>
          <span className="text-muted-foreground">/</span>
          <span>
            下架 <strong className="text-red-700 dark:text-red-400">{stats.offShelf}</strong>
          </span>
        </div>
      }
      toolbarRight={
        <div className="flex items-center gap-2">
          <Select value={globalFilter} onValueChange={(v) => setGlobalFilter(v ?? "")}>
            <SelectTrigger className="w-28" size="sm">
              <SelectValue placeholder="全局状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部</SelectItem>
              <SelectItem value="0">下架</SelectItem>
              <SelectItem value="1">可售</SelectItem>
            </SelectContent>
          </Select>
          <Select value={storeFilter} onValueChange={(v) => setStoreFilter(v ?? "")}>
            <SelectTrigger className="w-28" size="sm">
              <SelectValue placeholder="门店状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部</SelectItem>
              <SelectItem value="0">售罄</SelectItem>
              <SelectItem value="1">可售</SelectItem>
            </SelectContent>
          </Select>
          <Select value={finalFilter} onValueChange={(v) => setFinalFilter(v ?? "")}>
            <SelectTrigger className="w-28" size="sm">
              <SelectValue placeholder="最终状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部</SelectItem>
              <SelectItem value="下架">下架</SelectItem>
              <SelectItem value="售罄">售罄</SelectItem>
              <SelectItem value="可售">可售</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
      header={
        <TableHeader className="sticky top-0 z-50 bg-background">
          <TableRow>
            <TableHead>商品名称</TableHead>
            <TableHead>价格</TableHead>
            <TableHead>全局状态</TableHead>
            <TableHead>门店状态</TableHead>
            <TableHead>最终状态</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
      }
      body={data.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.name}</TableCell>
          <TableCell>¥ {item.price.toFixed(2)}</TableCell>
          <TableCell>
            <span className={PRODUCT_STATUS_TEXT_CLASSES[item.globalStatus] ?? ""}>
              {PRODUCT_STATUS_LABEL[item.globalStatus] ?? String(item.globalStatus)}
            </span>
          </TableCell>
          <TableCell>
            <span className={STORE_PRODUCT_STATUS_TEXT_CLASSES[item.storeStatus] ?? ""}>
              {STORE_PRODUCT_STATUS_LABEL[item.storeStatus] ?? String(item.storeStatus)}
            </span>
          </TableCell>
          <TableCell>
            <span className={getProductFinalStatus(item.globalStatus, item.storeStatus).className}>
              {getProductFinalStatus(item.globalStatus, item.storeStatus).label}
            </span>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Button
                variant={item.storeStatus === 1 ? "outline-destructive" : "outline-success"}
                size="sm"
                onClick={() =>
                  setToggleTarget({
                    id: item.id,
                    name: item.name,
                    currentStatus: item.storeStatus,
                  })
                }
              >
                {item.storeStatus === 1 ? "转门店售罄" : "转门店可售"}
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
      loading={loading}
      isEmpty={data.length === 0}
      colSpan={6}
      onRefresh={() => fetchData(page)}
      refreshDisabled={loading}
      hideRefresh
      emptyIcon={<PackageIcon className="size-4" />}
      emptyText="暂无数据"
      pagination={{ page, pageSize, total, onPageChange: fetchData }}
    />

    <Dialog
      open={toggleTarget !== null}
      onOpenChange={(open) => {
        if (!open) setToggleTarget(null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <AlertTriangleIcon className="mr-1.5 inline size-4 text-destructive" />
            确认操作
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          确认修改「{toggleTarget?.name}」的门店状态为{toggleTarget?.currentStatus === 1 ? "售罄" : "可售"}？
        </DialogDescription>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setToggleTarget(null)}
          >
            取消
          </Button>
          <Button variant="destructive" onClick={handleToggleConfirm}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
