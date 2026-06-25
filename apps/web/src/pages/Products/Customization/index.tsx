import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PlusIcon, SettingsIcon, BanIcon, CheckCircleIcon } from "lucide-react"
import { toast } from "sonner"

import type { ProductCustomization } from "@dextea/shared-types"
import { PRODUCT_CUSTOMIZATION_STATUS } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { getProductCustomizations, updateProductCustomization } from "@/services"
import { CreateCustomizationDialog } from "./components/CreateCustomizationDialog"

export default function CustomizationPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ProductCustomization[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const pageSize = 20

  const fetchItems = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getProductCustomizations({ page: targetPage, pageSize })
      if (res.code === 0) {
        setItems(res.data.items)
        setTotal(res.data.total)
        setPage(res.data.page)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取客制化项目列表失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems(1)
  }, [fetchItems])

  const handleCreated = () => {
    setDialogOpen(false)
    fetchItems(1)
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => setDialogOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          新建客制化项目
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : (
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">项目ID</TableHead>
              <TableHead className="w-2/5">名称</TableHead>
              <TableHead className="w-2/5">展示名称</TableHead>
              <TableHead className="w-32">状态</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  暂无客制化项目
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.displayName || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.status === PRODUCT_CUSTOMIZATION_STATUS.OFF.value
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30"
                      }
                    >
                      {item.status === PRODUCT_CUSTOMIZATION_STATUS.OFF.value ? "下架" : "启用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/products/customization/${item.id}`)}
                      >
                        <SettingsIcon data-icon="inline-start" />
                        管理
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          item.status === PRODUCT_CUSTOMIZATION_STATUS.OFF.value
                            ? "text-green-600 hover:text-green-600"
                            : "text-red-600 hover:text-red-600"
                        }
                        onClick={async () => {
                          const newStatus = item.status === PRODUCT_CUSTOMIZATION_STATUS.OFF.value
                            ? PRODUCT_CUSTOMIZATION_STATUS.ON.value
                            : PRODUCT_CUSTOMIZATION_STATUS.OFF.value
                          try {
                            const res = await updateProductCustomization(item.id, {
                              name: item.name,
                              displayName: item.displayName,
                              status: newStatus,
                            })
                            if (res.code === 0) {
                              toast.success(newStatus === PRODUCT_CUSTOMIZATION_STATUS.ON.value ? "已启用" : "已下架")
                              fetchItems(page)
                            } else {
                              toast.error(res.message)
                            }
                          } catch {
                            toast.error("更新状态失败")
                          }
                        }}
                      >
                        {item.status === PRODUCT_CUSTOMIZATION_STATUS.OFF.value
                          ? <><CheckCircleIcon data-icon="inline-start" />启用</>
                          : <><BanIcon data-icon="inline-start" />下架</>
                        }
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {!loading && items.length > 0 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page > 1) fetchItems(page - 1) }}
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
                for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                  pages.push(i)
                }
                if (page < totalPages - 2) pages.push("...")
                pages.push(totalPages)
              }
              return pages.map((p, idx) =>
                p === "..." ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e: React.MouseEvent) => { e.preventDefault(); fetchItems(p) }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )
            })()}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page < Math.ceil(total / pageSize)) fetchItems(page + 1) }}
                text="下一页"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <CreateCustomizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleCreated}
      />
    </div>
  )
}
