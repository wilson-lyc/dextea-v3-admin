import React, { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  PackageIcon,
  RefreshCwIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { Product } from "@dextea/shared-types"
import { PRODUCT_STATUS } from "@dextea/shared-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { getProducts } from "@/services"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { CreateProductDialog } from "./components/CreateProductDialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const STATUS_TEXT: Record<number, { label: string; className: string }> = {
  0: { label: "下架", className: "text-red-600 dark:text-red-400" },
  1: { label: "可售", className: "text-green-600 dark:text-green-400" },
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchProducts = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const params: { page?: number; pageSize?: number; keyword?: string } = {
        page: targetPage,
        pageSize,
      }
      if (searchKeyword) {
        params.keyword = searchKeyword
      }
      const res = await getProducts(params)
      setProducts(res.data.items)
      setTotal(res.data.total)
      setPage(targetPage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取商品列表失败")
    } finally {
      setLoading(false)
    }
  }, [searchKeyword, pageSize])

  useEffect(() => {
    fetchProducts(1)
  }, [fetchProducts])

  const handleSearch = () => {
    // TODO: 搜索逻辑
    setSearchKeyword(keyword)
  }

  const refreshProducts = useCallback(async (targetPage: number) => {
    if (loading) return
    await fetchProducts(targetPage)
    toast.success('数据已更新')
  }, [loading, fetchProducts])

  const handleCreate = () => {
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={handleCreate}>
            <PlusIcon data-icon="inline-start" />
            新增商品
          </Button>
          <Button variant="outline" size="icon" onClick={() => refreshProducts(page)} disabled={loading}>
            <RefreshCwIcon className={cn(loading && "animate-spin")} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索商品名称"
              className="pl-8"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch()
              }}
            />
          </div>
          <Button variant="secondary" onClick={handleSearch}>
            搜索
          </Button>
          {searchKeyword && (
            <Button
              variant="ghost"
              onClick={() => {
                setKeyword("")
                setSearchKeyword("")
              }}
            >
              清除
            </Button>
          )}
        </div>
      </div>

      {/* Table area (always renders) */}
      <ScrollArea className="max-h-[calc(100vh-480px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>商品ID</TableHead>
              <TableHead>商品名称</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>标签</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <Spinner className="mx-auto size-6 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <Empty>
                    <EmptyMedia variant="icon">
                      <PackageIcon className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>暂无数据</EmptyTitle>
                    <Button onClick={() => setDialogOpen(true)}>
                      立即添加
                    </Button>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs">{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell><span className="tabular-nums">¥ {product.price.toFixed(2)}</span></TableCell>
                  <TableCell>
                    <span className={STATUS_TEXT[product.status]?.className ?? ""}>
                      {STATUS_TEXT[product.status]?.label ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {product.tags && product.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.tags.map(tag => (
                          <Badge key={tag.id} variant="outline">{tag.name}</Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/products/${product.id}`)}>
                      <SettingsIcon data-icon="inline-start" />
                      管理
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Pagination */}
      {!loading && products.length > 0 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  if (page > 1) fetchProducts(page - 1)
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
                        fetchProducts(p)
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
                  if (page < Math.ceil(total / pageSize)) fetchProducts(page + 1)
                }}
                text="下一页"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <CreateProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => fetchProducts(page)}
      />
    </div>
  )
}
