import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDownIcon, ListIcon } from "lucide-react"
import { toast } from "sonner"

import type { StoreCustomizationOptionItem } from "@/api"
import {
  CUSTOMIZATION_OPTION_STATUS,
  CUSTOMIZATION_OPTION_STATUS_LABEL,
  CUSTOMIZATION_OPTION_STATUS_TEXT_CLASSES,
  CUSTOMIZATION_OPTION_STORE_STATUS,
  CUSTOMIZATION_OPTION_STORE_STATUS_LABEL,
  CUSTOMIZATION_OPTION_STORE_STATUS_TEXT_CLASSES,
  CUSTOMIZATION_OPTION_STORE_STATUS_ACTION,
} from "@dextea-admin/contracts/status"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logger, extractBackendMessage } from "@/lib/logger"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  batchUpdateCustomizationOptionStoreStatus,
  getStoreCustomizationOptions,
  updateCustomizationOptionStoreStatus,
} from "@/api/store"

interface StoreCustomizationOptionStatusDialogProps {
  storeId: number
  customizationId: number
  customizationName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const pageSize = 20

export default function StoreCustomizationOptionStatusDialog({
  storeId,
  customizationId,
  customizationName,
  open,
  onOpenChange,
}: StoreCustomizationOptionStatusDialogProps) {
  const [data, setData] = useState<StoreCustomizationOptionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [togglingId, setTogglingId] = useState<number | null>(null)

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

  const fetchData = useCallback(
    async (targetPage: number) => {
      setLoading(true)
      try {
        const res = await getStoreCustomizationOptions(storeId, customizationId, {
          page: targetPage,
          pageSize,
        })
        if (res.code === 0) {
          setData(res.data.items)
          setTotal(res.data.total)
          setPage(targetPage)
      }
      } catch (err) {
        logger.error(extractBackendMessage(err) ?? "未知错误", {
          module: "门店",
          label: "获取客制化选项列表",
        })
        toast.error("获取客制化选项列表失败，请稍后重试")
      } finally {
        setLoading(false)
      }
    },
    [storeId, customizationId],
  )

  // 客制化选项门店状态为懒加载：仅在 dialog 打开时拉取，关闭即清空
  useEffect(() => {
    if (open) {
      setPage(1)
      setSelectedIds(new Set())
      fetchData(1)
    } else {
      setData([])
      setSelectedIds(new Set())
    }
  }, [open, fetchData])

  const handleToggle = useCallback(
    async (option: StoreCustomizationOptionItem) => {
      const target =
        option.storeStatus === CUSTOMIZATION_OPTION_STORE_STATUS.STORE_ACTIVE.value
          ? CUSTOMIZATION_OPTION_STORE_STATUS.STORE_DISABLED.value
          : CUSTOMIZATION_OPTION_STORE_STATUS.STORE_ACTIVE.value

      // 乐观更新
      setData((prev) =>
        prev.map((o) => (o.id === option.id ? { ...o, storeStatus: target } : o)),
      )
      setTogglingId(option.id)

      try {
        const res = await updateCustomizationOptionStoreStatus(storeId, option.id, {
          status: target,
        })
      void res
      } catch (err) {
        setData((prev) =>
          prev.map((o) =>
            o.id === option.id ? { ...o, storeStatus: option.storeStatus } : o,
          ),
        )
        logger.error(extractBackendMessage(err) ?? "未知错误", {
          module: "门店",
          label: "更新客制化选项状态",
        })
        toast.error("更新选项门店状态失败，请稍后重试")
      } finally {
        setTogglingId(null)
      }
    },
    [storeId],
  )

  const allSelected = data.length > 0 && selectedIds.size === data.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === data.length ? new Set() : new Set(data.map((o) => o.id)),
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
      const res = await batchUpdateCustomizationOptionStoreStatus(storeId, ids, batchConfirmAction)
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
        label: "批量更新客制化选项门店状态",
      })
      toast.error(extractBackendMessage(err) ?? "批量更新失败，请稍后重试")
    } finally {
      setBatchUpdating(false)
    }
  }, [storeId, selectedIds, batchConfirmAction, fetchData, page])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[70vh] w-[40vw] max-w-none sm:max-w-none flex-col gap-4">
        <DialogHeader>
          <DialogTitle>客制化选项门店状态 - {customizationName}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <DataTable
            toolbarLeft={
              selectedIds.size > 0 ? (
                <div className="flex items-center gap-4 text-sm">
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
                          批量激活
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => openBatchConfirm(0)}
                        >
                          批量禁用
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ) : undefined
            }
            header={
              <TableHeader className="sticky top-0 z-50 bg-background">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="全选"
                    />
                  </TableHead>
                  <TableHead className="w-24">选项ID</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead className="w-28">价格</TableHead>
                  <TableHead className="w-24">全局状态</TableHead>
                  <TableHead className="w-24">门店状态</TableHead>
                  <TableHead className="w-24">最终状态</TableHead>
                  <TableHead className="w-40 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
            }
            body={data.map((o) => (
              <TableRow
                key={o.id}
                data-state={selectedIds.has(o.id) ? "selected" : undefined}
              >
                <TableCell className="w-10">
                  <Checkbox
                    checked={selectedIds.has(o.id)}
                    onCheckedChange={() => toggleSelectOne(o.id)}
                    aria-label={`选择 ${o.name}`}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">{o.id}</TableCell>
                <TableCell>{o.name}</TableCell>
                <TableCell className="font-mono text-xs">
                  ¥ {Number(o.price).toFixed(2)}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      CUSTOMIZATION_OPTION_STATUS_TEXT_CLASSES[o.globalStatus] ?? ""
                    }
                  >
                    {CUSTOMIZATION_OPTION_STATUS_LABEL[o.globalStatus] ??
                      String(o.globalStatus)}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      CUSTOMIZATION_OPTION_STORE_STATUS_TEXT_CLASSES[o.storeStatus] ?? ""
                    }
                  >
                    {CUSTOMIZATION_OPTION_STORE_STATUS_LABEL[o.storeStatus] ??
                      String(o.storeStatus)}
                  </span>
                </TableCell>
                <TableCell>
                  {(() => {
                    const finalDisabled =
                      o.globalStatus === CUSTOMIZATION_OPTION_STATUS.GLOBAL_DISABLED.value
                    const finalValue = finalDisabled ? 0 : o.storeStatus
                    const finalLabel = finalDisabled
                      ? CUSTOMIZATION_OPTION_STATUS_LABEL[finalValue]
                      : CUSTOMIZATION_OPTION_STORE_STATUS_LABEL[finalValue]
                    const finalClass = finalDisabled
                      ? CUSTOMIZATION_OPTION_STATUS_TEXT_CLASSES[finalValue]
                      : CUSTOMIZATION_OPTION_STORE_STATUS_TEXT_CLASSES[finalValue]
                    return (
                      <span className={finalClass ?? ""}>{finalLabel ?? String(finalValue)}</span>
                    )
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant={
                        o.storeStatus === CUSTOMIZATION_OPTION_STORE_STATUS.STORE_ACTIVE.value
                          ? "outline-destructive"
                          : "outline-success"
                      }
                      size="sm"
                      disabled={togglingId === o.id}
                      onClick={() => handleToggle(o)}
                    >
                      {togglingId === o.id
                        ? "处理中..."
                        : CUSTOMIZATION_OPTION_STORE_STATUS_ACTION[o.storeStatus]}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            loading={loading}
            isEmpty={data.length === 0}
            colSpan={8}
            fixedLayout
            hideRefresh
            hideToolbar
            emptyIcon={<ListIcon className="size-4" />}
            emptyText="暂无选项"
            pagination={{ page, pageSize, total, onPageChange: fetchData }}
          />
        </div>

      <ConfirmDialog
        open={batchConfirmOpen}
        onOpenChange={setBatchConfirmOpen}
        title="批量操作确认"
        description={`确认将选中的 ${selectedIds.size} 个客制化选项的门店状态修改为「${batchConfirmAction === 1 ? "门店可用" : "门店不可用"}」？`}
        onConfirm={handleBatchConfirm}
        loading={batchUpdating}
      />
      </DialogContent>
    </Dialog>
  )
}
