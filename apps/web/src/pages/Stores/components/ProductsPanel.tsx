import { useCallback, useEffect, useState } from "react"
import { PackageIcon } from "lucide-react"
import { toast } from "sonner"

import type { StoreProductItem } from "@dextea/shared-types"
import { PRODUCT_STATUS } from "@dextea/shared-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { getStoreProducts, updateProductStoreStatus } from "@/services/store-status"

const PRODUCT_STATUS_LABEL: Record<number, { label: string; className: string }> = {
  0: {
    label: "下架",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  1: {
    label: "可售",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
}

interface ProductsPanelProps {
  storeId: number
}

export function ProductsPanel({ storeId }: ProductsPanelProps) {
  const [data, setData] = useState<StoreProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const fetchData = useCallback(
    async (targetPage: number) => {
      setLoading(true)
      try {
        const res = await getStoreProducts(storeId, {
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
        toast.error("获取商品列表失败")
      } finally {
        setLoading(false)
      }
    },
    [storeId],
  )

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  const handleToggleStatus = async (
    productId: number,
    currentStatus: number,
  ) => {
    const newStatus =
      currentStatus === PRODUCT_STATUS.OFF.value
        ? PRODUCT_STATUS.ON.value
        : PRODUCT_STATUS.OFF.value
    setData((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, storeStatus: newStatus } : item,
      ),
    )

    try {
      const res = await updateProductStoreStatus(storeId, productId, {
        status: newStatus,
      })
      if (res.code !== 0) {
        setData((prev) =>
          prev.map((item) =>
            item.id === productId
              ? { ...item, storeStatus: currentStatus }
              : item,
          ),
        )
        toast.error(res.message)
      }
    } catch {
      setData((prev) =>
        prev.map((item) =>
          item.id === productId
            ? { ...item, storeStatus: currentStatus }
            : item,
        ),
      )
      toast.error("更新商品门店状态失败")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ScrollArea className="max-h-[calc(100vh-480px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>商品名称</TableHead>
              <TableHead>价格(¥)</TableHead>
              <TableHead>全局状态</TableHead>
              <TableHead className="w-28 text-right">门店状态</TableHead>
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
                  <TableCell>{item.price}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        PRODUCT_STATUS_LABEL[item.globalStatus]?.className ??
                        ""
                      }
                    >
                      {PRODUCT_STATUS_LABEL[item.globalStatus]?.label ??
                        String(item.globalStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={
                        item.storeStatus === PRODUCT_STATUS.ON.value
                      }
                      onCheckedChange={() =>
                        handleToggleStatus(item.id, item.storeStatus)
                      }
                    />
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
    </div>
  )
}
