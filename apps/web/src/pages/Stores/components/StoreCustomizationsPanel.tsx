import { useCallback, useEffect, useState } from "react"
import { PuzzleIcon } from "lucide-react"
import { toast } from "sonner"

import type { StoreCustomizationItem, StoreCustomizationOptionItem } from "@dextea/shared-types"
import { PRODUCT_CUSTOMIZATION_STATUS, CUSTOMIZATION_OPTION_STATUS } from "@dextea/shared-types"
import { PRODUCT_CUSTOMIZATION_STATUS_LABEL, PRODUCT_CUSTOMIZATION_STATUS_BADGE_CLASSES, CUSTOMIZATION_OPTION_STATUS_LABEL, CUSTOMIZATION_OPTION_STATUS_BADGE_CLASSES } from "@/lib/status"

import { Badge } from "@/components/ui/badge"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  getStoreCustomizations,
  getStoreCustomizationOptions,
  updateCustomizationOptionStoreStatus,
} from "@/services/store-status"

interface StoreCustomizationsPanelProps {
  storeId: number
}

export function StoreCustomizationsPanel({ storeId }: StoreCustomizationsPanelProps) {
  const [data, setData] = useState<StoreCustomizationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedCustomization, setSelectedCustomization] =
    useState<StoreCustomizationItem | null>(null)
  const [options, setOptions] = useState<StoreCustomizationOptionItem[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)

  const fetchData = useCallback(
    async (targetPage: number) => {
      setLoading(true)
      try {
        const res = await getStoreCustomizations(storeId, {
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
    [storeId],
  )

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  const openOptionsSheet = useCallback(
    async (customization: StoreCustomizationItem) => {
      setSelectedCustomization(customization)
      setSheetOpen(true)
      setOptionsLoading(true)
      setOptions([])
      try {
        const res = await getStoreCustomizationOptions(storeId, customization.id)
        if (res.code === 0) {
          setOptions(res.data.items)
        } else {
          toast.error(res.message)
        }
      } catch {
        toast.error("获取客制化选项列表失败")
      } finally {
        setOptionsLoading(false)
      }
    },
    [storeId],
  )

  const handleToggleOptionStatus = useCallback(
    async (option: StoreCustomizationOptionItem) => {
      const newStatus =
        option.storeStatus === CUSTOMIZATION_OPTION_STATUS.ON.value
          ? CUSTOMIZATION_OPTION_STATUS.OFF.value
          : CUSTOMIZATION_OPTION_STATUS.ON.value

      setOptions((prev) =>
        prev.map((o) =>
          o.id === option.id ? { ...o, storeStatus: newStatus } : o,
        ),
      )

      try {
        const res = await updateCustomizationOptionStoreStatus(storeId, option.id, {
          status: newStatus,
        })
        if (res.code !== 0) {
          setOptions((prev) =>
            prev.map((o) =>
              o.id === option.id
                ? { ...o, storeStatus: option.storeStatus }
                : o,
            ),
          )
          toast.error(res.message)
        }
      } catch {
        setOptions((prev) =>
          prev.map((o) =>
            o.id === option.id
              ? { ...o, storeStatus: option.storeStatus }
              : o,
          ),
        )
        toast.error("更新客制化选项门店状态失败")
      }
    },
    [storeId],
  )

  return (
    <div className="flex flex-col gap-4">
      <ScrollArea className="max-h-[calc(100vh-480px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>项目名称</TableHead>
              <TableHead>展示名称</TableHead>
              <TableHead>全局状态</TableHead>
              <TableHead className="w-20 text-right">选项数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  加载中...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <Empty>
                    <EmptyMedia variant="icon">
                      <PuzzleIcon className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>暂无数据</EmptyTitle>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => openOptionsSheet(item)}
                >
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.displayName}</TableCell>
                  <TableCell>
                    <Badge className={PRODUCT_CUSTOMIZATION_STATUS_BADGE_CLASSES[item.globalStatus] ?? ""}>
                      {PRODUCT_CUSTOMIZATION_STATUS_LABEL[item.globalStatus] ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {item.optionCount}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {!loading && data.length > 0 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  if (page > 1) fetchData(page - 1)
                }}
                text="上一页"
              />
            </PaginationItem>
            {(() => {
              const totalPages = Math.ceil(total / pageSize)
              const pages: (number | "...")[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (page > 3) pages.push("...")
                for (
                  let i = Math.max(2, page - 1);
                  i <= Math.min(totalPages - 1, page + 1);
                  i++
                ) {
                  pages.push(i)
                }
                if (page < totalPages - 2) pages.push("...")
                pages.push(totalPages)
              }
              return pages.map((p, idx) =>
                p === "..." ? (
                  <PaginationItem key={`e-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault()
                        fetchData(p)
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )
            })()}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  if (page < Math.ceil(total / pageSize))
                    fetchData(page + 1)
                }}
                text="下一页"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {selectedCustomization?.name ?? "客制化选项"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-auto px-4 pb-4">
            {optionsLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                加载中...
              </div>
            ) : options.length === 0 ? (
              <Empty>
                <EmptyMedia variant="icon">
                  <PuzzleIcon className="size-4" />
                </EmptyMedia>
                <EmptyTitle>暂无选项</EmptyTitle>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>选项名称</TableHead>
                    <TableHead className="w-20">价格</TableHead>
                    <TableHead className="w-20">全局状态</TableHead>
                    <TableHead className="w-20 text-right">门店状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {options.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell>{option.name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        ¥ {Number(option.price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={CUSTOMIZATION_OPTION_STATUS_BADGE_CLASSES[option.globalStatus] ?? ""}>
                          {CUSTOMIZATION_OPTION_STATUS_LABEL[option.globalStatus] ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={
                            option.storeStatus ===
                            CUSTOMIZATION_OPTION_STATUS.ON.value
                          }
                          onCheckedChange={() =>
                            handleToggleOptionStatus(option)
                          }
                          size="sm"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
