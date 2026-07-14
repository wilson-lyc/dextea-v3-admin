import { useCallback, useEffect, useRef, useState } from "react"
import { GripVerticalIcon, ListIcon } from "lucide-react"
import { toast } from "sonner"

import type { StoreCustomizationItem } from "@/api"
import {
  CUSTOMIZATION_STATUS_LABEL,
  CUSTOMIZATION_STATUS_TEXT_CLASSES,
} from "@dextea-admin/contracts/status"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"
import { getStoreCustomizations } from "@/api"
import StoreCustomizationOptionStatusDialog from "./StoreCustomizationOptionStatusDialog"

interface StoreCustomizationSheetProps {
  storeId: number
  productId: number
  productName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const pageSize = 20
const MIN_SHEET_WIDTH = 600
const MAX_SHEET_WIDTH_RATIO = 0.9

export default function StoreCustomizationSheet({
  storeId,
  productId,
  productName,
  open,
  onOpenChange,
}: StoreCustomizationSheetProps) {
  const [data, setData] = useState<StoreCustomizationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // 管理选项 dialog
  const [manageOpen, setManageOpen] = useState(false)
  const [managingItem, setManagingItem] = useState<StoreCustomizationItem | null>(null)

  // 拖动改宽度
  const [sheetWidth, setSheetWidth] = useState(840)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const fetchData = useCallback(
    async (targetPage: number) => {
      setLoading(true)
      try {
        const res = await getStoreCustomizations(storeId, {
          productId,
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
        toast.error("获取客制化项目列表失败")
      } finally {
        setLoading(false)
      }
    },
    [storeId, productId],
  )

  useEffect(() => {
    if (open) {
      setPage(1)
      fetchData(1)
    } else {
      setData([])
    }
  }, [open, fetchData])

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isResizing.current = true
      startX.current = e.clientX
      startWidth.current = sheetWidth

      document.body.style.cursor = "ew-resize"
      document.body.style.userSelect = "none"

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current) return
        const diff = startX.current - moveEvent.clientX
        const panelWidth = startWidth.current + diff
        const maxWidth = window.innerWidth * MAX_SHEET_WIDTH_RATIO
        setSheetWidth(Math.max(MIN_SHEET_WIDTH, Math.min(panelWidth, maxWidth)))
      }

      const handleMouseUp = () => {
        isResizing.current = false
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [sheetWidth],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" style={{ width: sheetWidth, maxWidth: "none" }} className="gap-0">
        <SheetHeader>
          <SheetTitle>客制化项目管理 - {productName}</SheetTitle>
        </SheetHeader>

        <div
          className="absolute left-0 top-0 z-20 flex h-full w-4 cursor-ew-resize items-center justify-center opacity-0 transition-opacity hover:opacity-100"
          onMouseDown={handleResizeStart}
        >
          <div className="flex h-8 w-0.5 items-center justify-center rounded-full bg-border">
            <GripVerticalIcon className="size-3 text-muted-foreground" />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-0">
          <DataTable
            header={
              <TableHeader className="sticky top-0 z-50 bg-background">
                <TableRow>
                  <TableHead className="w-24">项目ID</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead className="w-24">全局状态</TableHead>
                  <TableHead className="w-40 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
            }
            body={data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <span className={CUSTOMIZATION_STATUS_TEXT_CLASSES[item.globalStatus] ?? ""}>
                    {CUSTOMIZATION_STATUS_LABEL[item.globalStatus] ?? String(item.globalStatus)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setManagingItem(item)
                        setManageOpen(true)
                      }}
                    >
                      管理选项
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            loading={loading}
            isEmpty={data.length === 0}
            colSpan={4}
            fixedLayout
            hideRefresh
            emptyIcon={<ListIcon className="size-4" />}
            emptyText="该商品暂未绑定客制化项目"
            pagination={{ page, pageSize, total, onPageChange: fetchData }}
          />
        </div>
      </SheetContent>

      {managingItem && (
        <StoreCustomizationOptionStatusDialog
          storeId={storeId}
          customizationId={managingItem.id}
          customizationName={managingItem.name}
          open={manageOpen}
          onOpenChange={(o) => {
            setManageOpen(o)
            if (!o) setManagingItem(null)
          }}
        />
      )}
    </Sheet>
  )
}
