import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDownIcon, PackageIcon } from "lucide-react"
import { toast } from "sonner"

import type { StoreProductItem } from "@/api"
import { PRODUCT_STATUS, STORE_PRODUCT_STATUS, PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TEXT_CLASSES, STORE_PRODUCT_STATUS_LABEL, STORE_PRODUCT_STATUS_TEXT_CLASSES, getProductFinalStatus } from "@dextea-admin/contracts/status"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DataTable from "@/components/ui/data-table"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import {
  batchUpdateProductStoreStatus,
  getStoreProducts,
  updateProductStoreStatus,
} from "@/api/store"
import { logger, extractBackendMessage } from "@/lib/logger"
import StoreCustomizationSheet from "./StoreCustomizationSheet"

interface StoreProductStatusPanelProps {
  storeId: number
}

export function StoreProductStatusPanel({ storeId }: StoreProductStatusPanelProps) {
  const navigate = useNavigate()
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

        if (finalFilter === "全局下架") {
          params.globalStatus = "0"
        } else if (finalFilter === "门店售罄") {
          params.globalStatus = "1"
          params.storeStatus = "0"
        } else if (finalFilter === "门店可售") {
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
      }
      } catch (err) {
        logger.error(extractBackendMessage(err) ?? "未知错误", {
          module: "门店",
          label: "获取商品状态列表",
        })
        toast.error("获取商品列表失败，请稍后重试")
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
  const [toggling, setToggling] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false)
  const [batchConfirmAction, setBatchConfirmAction] = useState<0 | 1>(0)
  const [batchUpdating, setBatchUpdating] = useState(false)
  const [batchMenuOpen, setBatchMenuOpen] = useState(false)
  const batchMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openBatchMenu = useCallback(() => {
    if (batchMenuCloseTimer.current) clearTimeout(batchMenuCloseTimer.current)
    setBatchMenuOpen(true)
  }, [])
  const scheduleCloseBatchMenu = useCallback(() => {
    if (batchMenuCloseTimer.current) clearTimeout(batchMenuCloseTimer.current)
    batchMenuCloseTimer.current = setTimeout(() => {
      setBatchMenuOpen(false)
      batchMenuCloseTimer.current = null
    }, 120)
  }, [])

  // 客制化项目管理 sheet
  const [customizationTarget, setCustomizationTarget] = useState<{
    id: number
    name: string
  } | null>(null)
  const [customizationOpen, setCustomizationOpen] = useState(false)

  const handleToggleConfirm = useCallback(async () => {
    if (!toggleTarget) return
    const { id, currentStatus } = toggleTarget
    const newStatus =
      currentStatus === 1 ? 0 : 1

    setToggling(true)
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
      } catch (err) {
        setData((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, storeStatus: currentStatus }
              : item,
          ),
        )
        logger.error(extractBackendMessage(err) ?? "未知错误", {
          module: "门店",
          label: "更新商品门店状态",
        })
        toast.error("更新商品门店状态失败，请稍后重试")
      } finally {
        setToggling(false)
      }
  }, [storeId, toggleTarget])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [data])

  const allSelected = data.length > 0 && selectedIds.size === data.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === data.length ? new Set() : new Set(data.map((item) => item.id)),
    )
  }, [data])

  const toggleSelectOne = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const openBatchConfirm = useCallback((targetStatus: 0 | 1) => {
    if (selectedIds.size === 0) return
    setBatchConfirmAction(targetStatus)
    setBatchConfirmOpen(true)
  }, [selectedIds])

  const handleBatchConfirm = useCallback(async () => {
    const ids = [...selectedIds]
    if (ids.length === 0) return

    setBatchUpdating(true)
    try {
      const res = await batchUpdateProductStoreStatus(storeId, ids, batchConfirmAction)
      if (res.code === 0) {
        toast.success(res.message ?? "批量更新成功")
        setBatchConfirmOpen(false)
        setSelectedIds(new Set())
        await fetchData(page)
      } else {
        toast.error(res.message ?? "批量更新失败")
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "门店",
        label: "批量更新商品门店状态",
      })
      toast.error(extractBackendMessage(err) ?? "批量更新失败，请稍后重试")
    } finally {
      setBatchUpdating(false)
    }
  }, [storeId, selectedIds, batchConfirmAction, fetchData, page])

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
              门店可售 <strong className="text-green-700 dark:text-green-400">{stats.available}</strong>
            </span>
            <span className="text-muted-foreground">/</span>
            <span>
              门店售罄 <strong className="text-red-700 dark:text-red-400">{stats.soldOut}</strong>
            </span>
            <span className="text-muted-foreground">/</span>
            <span>
              全局下架 <strong className="text-red-700 dark:text-red-400">{stats.offShelf}</strong>
            </span>
            {selectedIds.size > 0 && (
              <>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">
                  已选 <strong className="text-foreground">{selectedIds.size}</strong> 项
                </span>
                <div className="flex items-center" onMouseLeave={scheduleCloseBatchMenu}>
                  <DropdownMenu open={batchMenuOpen} onOpenChange={setBatchMenuOpen}>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          size="sm"
                          onMouseEnter={openBatchMenu}
                          onClick={openBatchMenu}
                        />
                      }
                    >
                      批量操作
                      <ChevronDownIcon className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      onMouseEnter={openBatchMenu}
                      onMouseLeave={scheduleCloseBatchMenu}
                    >
                      <DropdownMenuItem onClick={() => openBatchConfirm(1)}>
                        转门店可售
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => openBatchConfirm(0)}
                      >
                        转门店售罄
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
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
                {Object.values(PRODUCT_STATUS).map((s) => (
                  <SelectItem key={s.value} value={String(s.value)}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={storeFilter} onValueChange={(v) => setStoreFilter(v ?? "")}>
              <SelectTrigger className="w-28" size="sm">
                <SelectValue placeholder="门店状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部</SelectItem>
                {Object.values(STORE_PRODUCT_STATUS).map((s) => (
                  <SelectItem key={s.value} value={String(s.value)}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={finalFilter} onValueChange={(v) => setFinalFilter(v ?? "")}>
              <SelectTrigger className="w-28" size="sm">
                <SelectValue placeholder="最终状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部</SelectItem>
                <SelectItem value="全局下架">全局下架</SelectItem>
                <SelectItem value="门店售罄">门店售罄</SelectItem>
                <SelectItem value="门店可售">门店可售</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        header={
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              <TableHead className="w-[4%]">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleSelectAll}
                  aria-label="全选"
                />
              </TableHead>
              <TableHead className="w-[12%]">商品名称</TableHead>
              <TableHead className="w-[12%]">价格</TableHead>
              <TableHead className="w-[12%]">全局状态</TableHead>
              <TableHead className="w-[12%]">门店状态</TableHead>
              <TableHead className="w-[16%]">最终状态</TableHead>
              <TableHead className="w-[32%] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={data.map((item) => (
          <TableRow key={item.id} data-state={selectedIds.has(item.id) ? "selected" : undefined}>
            <TableCell className="w-[4%]">
              <Checkbox
                checked={selectedIds.has(item.id)}
                onCheckedChange={() => toggleSelectOne(item.id)}
                aria-label={`选择 ${item.name}`}
              />
            </TableCell>
            <TableCell className="w-[12%] truncate">{item.name}</TableCell>
            <TableCell className="w-[12%]">¥ {item.price.toFixed(2)}</TableCell>
            <TableCell className="w-[12%]">
              <span className={PRODUCT_STATUS_TEXT_CLASSES[item.globalStatus] ?? ""}>
                {PRODUCT_STATUS_LABEL[item.globalStatus] ?? String(item.globalStatus)}
              </span>
            </TableCell>
            <TableCell className="w-[12%]">
              <span className={STORE_PRODUCT_STATUS_TEXT_CLASSES[item.storeStatus] ?? ""}>
                {STORE_PRODUCT_STATUS_LABEL[item.storeStatus] ?? String(item.storeStatus)}
              </span>
            </TableCell>
            <TableCell className="w-[16%]">
              <span className={getProductFinalStatus(item.globalStatus, item.storeStatus).className}>
                {getProductFinalStatus(item.globalStatus, item.storeStatus).label}
              </span>
            </TableCell>
            <TableCell className="w-[32%] text-right">
              <div className="flex flex-nowrap items-center justify-end gap-1 whitespace-nowrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/products/${item.id}`)}
                >
                  查看商品
                </Button>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomizationTarget({ id: item.id, name: item.name })
                    setCustomizationOpen(true)
                  }}
                >
                  管理客制化
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={data.length === 0}
        colSpan={7}
        fixedLayout
        onRefresh={() => fetchData(page)}
        refreshDisabled={loading}
        hideRefresh
        emptyIcon={<PackageIcon className="size-4" />}
        emptyText="暂无数据"
        pagination={{ page, pageSize, total, onPageChange: fetchData }}
      />

      <ConfirmDialog
        open={toggleTarget !== null}
        onOpenChange={(open) => {
          if (!open) setToggleTarget(null)
        }}
        title="操作确认"
        description={`确认修改「${toggleTarget?.name}」的门店状态为「${toggleTarget?.currentStatus === 1 ? "门店售罄" : "门店可售"}」？`}
        onConfirm={handleToggleConfirm}
        loading={toggling}
      />

      <ConfirmDialog
        open={batchConfirmOpen}
        onOpenChange={setBatchConfirmOpen}
        title="批量操作确认"
        description={`确认将选中的 ${selectedIds.size} 个商品的门店状态修改为「${batchConfirmAction === 1 ? "门店可售" : "门店售罄"}」？`}
        onConfirm={handleBatchConfirm}
        loading={batchUpdating}
      />

      {customizationTarget && (
        <StoreCustomizationSheet
          storeId={storeId}
          productId={customizationTarget.id}
          productName={customizationTarget.name}
          open={customizationOpen}
          onOpenChange={(open) => {
            setCustomizationOpen(open)
            if (!open) setCustomizationTarget(null)
          }}
        />
      )}
    </>
  )
}
