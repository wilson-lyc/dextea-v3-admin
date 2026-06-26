import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PlusIcon, SearchIcon, SettingsIcon, BanIcon, CheckCircleIcon, ListIcon } from "lucide-react"
import { toast } from "sonner"

import type { ProductCustomization } from "@dextea/shared-types"
import { PRODUCT_CUSTOMIZATION_STATUS } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectPicker } from "@/components/ui/select-picker"
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
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
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

const STATUS_OPTIONS = [
  { label: "全部", value: "" },
  ...Object.values(PRODUCT_CUSTOMIZATION_STATUS).map((s) => ({
    label: s.key === "off" ? "下架" : "启用",
    value: String(s.value),
  })),
]

export default function CustomizationPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ProductCustomization[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const pageSize = 20

  const [keyword, setKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  const fetchItems = useCallback(async (targetPage: number, kw?: string, st?: string) => {
    setLoading(true)
    try {
      const params: { page: number; pageSize: number; keyword?: string; status?: number } = {
        page: targetPage,
        pageSize,
      }
      if (kw) {
        params.keyword = kw
      }
      if (st && st !== "") {
        params.status = Number(st)
      }
      const res = await getProductCustomizations(params)
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
  }, [pageSize])

  useEffect(() => {
    fetchItems(1)
  }, [fetchItems])

  const handleSearch = () => {
    setSearchKeyword(keyword)
    fetchItems(1, keyword, filterStatus)
  }

  const handleClear = () => {
    setKeyword("")
    setSearchKeyword("")
    setFilterStatus("")
    fetchItems(1)
  }

  const hasFilters = searchKeyword !== "" || filterStatus !== ""

  const handleCreated = () => {
    setDialogOpen(false)
    fetchItems(1)
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => setDialogOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          新建客制化
        </Button>
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索名称、展示名称"
              className="pl-8"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch()
              }}
            />
          </div>
          <SelectPicker
            options={STATUS_OPTIONS}
            value={filterStatus}
            onValueChange={setFilterStatus}
            placeholder="状态"
            className="w-28"
          />
          <Button variant="secondary" onClick={handleSearch}>
            搜索
          </Button>
          {hasFilters && (
            <Button variant="ghost" onClick={handleClear}>
              清除
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <ListIcon className="size-4" />
          </EmptyMedia>
          <EmptyTitle>暂无客制化项目</EmptyTitle>
        </Empty>
      ) : (
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">项目ID</TableHead>
              <TableHead className="w-2/5">名称</TableHead>
              <TableHead className="w-2/5">展示名称</TableHead>
              <TableHead className="w-32">状态</TableHead>
              <TableHead className="w-28 text-center">绑定商品</TableHead>
              <TableHead className="w-20 text-center">选项</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
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
                  <TableCell className="text-center font-mono text-xs">{item.boundCount}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{item.optionCount}</TableCell>
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
            }
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
