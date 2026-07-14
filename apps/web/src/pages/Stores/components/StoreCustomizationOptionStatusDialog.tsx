import { useCallback, useEffect, useState } from "react"
import { ListIcon } from "lucide-react"
import { toast } from "sonner"

import type { StoreCustomizationOptionItem } from "@/api"
import {
  CUSTOMIZATION_OPTION_STATUS_LABEL,
  CUSTOMIZATION_OPTION_STATUS_TEXT_CLASSES,
  CUSTOMIZATION_OPTION_STORE_STATUS,
  CUSTOMIZATION_OPTION_STORE_STATUS_LABEL,
  CUSTOMIZATION_OPTION_STORE_STATUS_TEXT_CLASSES,
  CUSTOMIZATION_OPTION_STORE_STATUS_ACTION,
} from "@dextea-admin/contracts/status"
import { Button } from "@/components/ui/button"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getStoreCustomizationOptions, updateCustomizationOptionStoreStatus } from "@/api"

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
        } else {
          toast.error(res.message)
        }
      } catch {
        toast.error("获取客制化选项列表失败")
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
      fetchData(1)
    } else {
      setData([])
    }
  }, [open, fetchData])

  const handleToggle = useCallback(
    async (option: StoreCustomizationOptionItem) => {
      const target =
        option.storeStatus === CUSTOMIZATION_OPTION_STORE_STATUS.ENABLED.value
          ? CUSTOMIZATION_OPTION_STORE_STATUS.DISABLED.value
          : CUSTOMIZATION_OPTION_STORE_STATUS.ENABLED.value

      // 乐观更新
      setData((prev) =>
        prev.map((o) => (o.id === option.id ? { ...o, storeStatus: target } : o)),
      )
      setTogglingId(option.id)

      try {
        const res = await updateCustomizationOptionStoreStatus(storeId, option.id, {
          status: target,
        })
        if (res.code !== 0) {
          // 回滚
          setData((prev) =>
            prev.map((o) =>
              o.id === option.id ? { ...o, storeStatus: option.storeStatus } : o,
            ),
          )
          toast.error(res.message)
        }
      } catch {
        setData((prev) =>
          prev.map((o) =>
            o.id === option.id ? { ...o, storeStatus: option.storeStatus } : o,
          ),
        )
        toast.error("更新选项门店状态失败")
      } finally {
        setTogglingId(null)
      }
    },
    [storeId],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[70vh] w-[40vw] max-w-none flex-col gap-4">
        <DialogHeader>
          <DialogTitle>客制化选项门店状态 - {customizationName}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <DataTable
            header={
              <TableHeader className="sticky top-0 z-50 bg-background">
                <TableRow>
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
              <TableRow key={o.id}>
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
                      o.globalStatus === CUSTOMIZATION_OPTION_STATUS.DISABLED.value
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
                        o.storeStatus === CUSTOMIZATION_OPTION_STORE_STATUS.ENABLED.value
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
            colSpan={7}
            fixedLayout
            hideRefresh
            hideToolbar
            emptyIcon={<ListIcon className="size-4" />}
            emptyText="暂无选项"
            pagination={{ page, pageSize, total, onPageChange: fetchData }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
