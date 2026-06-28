import { useCallback, useEffect, useMemo, useState } from "react"
import { PackageIcon, AlertTriangleIcon } from "lucide-react"
import { toast } from "sonner"

import type { StoreProductItem } from "@dextea/shared-types"

import { Button } from "@/components/ui/button"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getStoreProducts, updateProductStoreStatus } from "@/services/store-status"

const PRODUCT_STATUS_TEXT: Record<number, { label: string; className: string }> = {
  0: {
    label: "下架",
    className: "text-red-700 dark:text-red-400",
  },
  1: {
    label: "可售",
    className: "text-green-700 dark:text-green-400",
  },
}

const STORE_STATUS_TEXT: Record<number, { label: string; className: string }> = {
  0: {
    label: "售罄",
    className: "text-red-700 dark:text-red-400",
  },
  1: {
    label: "可售",
    className: "text-green-700 dark:text-green-400",
  },
}

function getFinalStatus(globalStatus: number, storeStatus: number) {
  if (globalStatus === 0) {
    return { label: "下架", className: "text-red-700 dark:text-red-400" }
  }
  if (storeStatus === 0) {
    return { label: "售罄", className: "text-red-700 dark:text-red-400" }
  }
  return { label: "可售", className: "text-green-700 dark:text-green-400" }
}

interface ProductsPanelProps {
  storeId: number
}

export function ProductsPanel({ storeId }: ProductsPanelProps) {
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-2">
          <Select value={globalFilter} onValueChange={setGlobalFilter}>
            <SelectTrigger className="w-28" size="sm">
              <SelectValue placeholder="全局状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部</SelectItem>
              <SelectItem value="0">下架</SelectItem>
              <SelectItem value="1">可售</SelectItem>
            </SelectContent>
          </Select>
          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-28" size="sm">
              <SelectValue placeholder="门店状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部</SelectItem>
              <SelectItem value="0">售罄</SelectItem>
              <SelectItem value="1">可售</SelectItem>
            </SelectContent>
          </Select>
          <Select value={finalFilter} onValueChange={setFinalFilter}>
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
      </div>
      <ScrollArea className="max-h-[calc(100vh-480px)]">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>商品名称</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>全局状态</TableHead>
              <TableHead>门店状态</TableHead>
              <TableHead>最终状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  加载中...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <Empty>
                    <EmptyMedia variant="icon">
                      <PackageIcon className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>暂无数据</EmptyTitle>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>¥ {item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        PRODUCT_STATUS_TEXT[item.globalStatus]?.className ??
                        ""
                      }
                    >
                      {PRODUCT_STATUS_TEXT[item.globalStatus]?.label ??
                        String(item.globalStatus)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        STORE_STATUS_TEXT[item.storeStatus]?.className ??
                        ""
                      }
                    >
                      {STORE_STATUS_TEXT[item.storeStatus]?.label ??
                        String(item.storeStatus)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={getFinalStatus(item.globalStatus, item.storeStatus).className}>
                      {getFinalStatus(item.globalStatus, item.storeStatus).label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setToggleTarget({
                          id: item.id,
                          name: item.name,
                          currentStatus: item.storeStatus,
                        })
                      }
                      className={
                        item.storeStatus === 1
                          ? "text-red-500 hover:text-red-500"
                          : "text-green-600 hover:text-green-600"
                      }
                    >
                      {item.storeStatus === 1 ? "转门店售罄" : "转门店可售"}
                    </Button>
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
    </div>
  )
}
