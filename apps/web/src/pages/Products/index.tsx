import React, { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  PackageIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { Product } from "@/api"
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TEXT_CLASSES } from "@/lib/status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { getProducts, getTagOptions, toggleProductStatus } from "@/api"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { SelectPicker } from "@/components/ui/select-picker"
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const keywordRef = useRef("")
  keywordRef.current = keyword

  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  const [filterStatus, setFilterStatus] = useState("")
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")
  const [selectedTag, setSelectedTag] = useState("")

  const [tagOptions, setTagOptions] = useState<Array<{ label: string; value: string }>>([])

  const filterRef = useRef({ filterStatus: "", priceMin: "", priceMax: "", selectedTag: "" })
  filterRef.current = { filterStatus, priceMin, priceMax, selectedTag }

  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false)
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<{ id: number; name: string } | null>(null)
  const [statusConfirmAction, setStatusConfirmAction] = useState<0 | 1>(0)
  const [statusToggling, setStatusToggling] = useState(false)

  useEffect(() => {
    getTagOptions()
      .then((res) => {
        if (res.code === 0) setTagOptions(res.data)
      })
      .catch(() => {})
  }, [])

  const hasFilters = !!(keyword || filterStatus || priceMin || priceMax || selectedTag)

  const fetchProducts = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const kw = keywordRef.current
      const { filterStatus, priceMin, priceMax, selectedTag } = filterRef.current
      const params: {
        page?: number; pageSize?: number; keyword?: string;
        status?: number; priceMin?: number; priceMax?: number; tagIds?: string;
      } = {
        page: targetPage,
        pageSize,
      }
      if (kw) {
        params.keyword = kw
      }
      if (filterStatus) {
        params.status = Number(filterStatus)
      }
      if (priceMin) {
        params.priceMin = Number(priceMin)
      }
      if (priceMax) {
        params.priceMax = Number(priceMax)
      }
      if (selectedTag) {
        params.tagIds = selectedTag
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
  }, [pageSize])

  useEffect(() => {
    fetchProducts(1)
  }, [])

  const handleSearch = () => {
    fetchProducts(1)
  }

  const handleClear = () => {
    setKeyword("")
    setFilterStatus("")
    setPriceMin("")
    setPriceMax("")
    setSelectedTag("")
  }

  const refreshProducts = useCallback(async (targetPage: number) => {
    if (loading) return
    await fetchProducts(targetPage)
    toast.success('数据已更新')
  }, [loading, fetchProducts])

  const handleCreate = () => {
    setDialogOpen(true)
  }

  const openStatusConfirm = (product: Product, targetStatus: 0 | 1) => {
    setStatusConfirmTarget({ id: product.id, name: product.name })
    setStatusConfirmAction(targetStatus)
    setStatusConfirmOpen(true)
  }

  const handleStatusToggle = async () => {
    if (!statusConfirmTarget) return
    setStatusToggling(true)
    try {
      const res = await toggleProductStatus(String(statusConfirmTarget.id), statusConfirmAction)
      if (res.code === 0) {
        toast.success(res.message)
        setStatusConfirmOpen(false)
        setStatusConfirmTarget(null)
        await fetchProducts(page)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败")
    } finally {
      setStatusToggling(false)
    }
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
          <SelectPicker
            options={[
              { label: "全部状态", value: "" },
              { label: "下架", value: "0" },
              { label: "可售", value: "1" },
            ]}
            value={filterStatus}
            onValueChange={setFilterStatus}
            placeholder="状态"
            className="w-28"
          />
          <Input
            placeholder="最低价"
            className="w-24"
            type="number"
            min={0}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <span className="text-muted-foreground">-</span>
          <Input
            placeholder="最高价"
            className="w-24"
            type="number"
            min={0}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
          <SelectPicker
            options={[
              { label: "全部标签", value: "" },
              ...tagOptions,
            ]}
            value={selectedTag}
            onValueChange={setSelectedTag}
            placeholder="标签筛选"
            className="w-28"
          />
          <Button variant="secondary" onClick={handleSearch}>
            搜索
          </Button>
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={handleClear}
            >
              清除
            </Button>
          )}
        </div>
      </div>

      {/* Table area (always renders) */}
      <ScrollArea className="max-h-[calc(100vh-480px)]">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">商品ID</TableHead>
              <TableHead>商品名称</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>全局状态</TableHead>
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
                    <span className={PRODUCT_STATUS_TEXT_CLASSES[product.status] ?? ""}>
                      {PRODUCT_STATUS_LABEL[product.status] ?? "—"}
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
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/products/${product.id}`)}>
                        <SettingsIcon data-icon="inline-start" />
                        管理
                      </Button>
                      {product.status === 0 && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => openStatusConfirm(product, 1)}
                        >
                          转全局可售
                        </Button>
                      )}
                      {product.status === 1 && (
                        <Button
                          variant="outline-destructive"
                          size="sm"
                          onClick={() => openStatusConfirm(product, 0)}
                        >
                          转全局下架
                        </Button>
                      )}
                    </div>
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

      <Dialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认{statusConfirmAction === 1 ? "上架" : "下架"}</DialogTitle>
            <DialogDescription>
              确定将「{statusConfirmTarget?.name}」更新为全局{statusConfirmAction === 1 ? "可售" : "下架"}吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button
              variant={statusConfirmAction === 1 ? "default" : "destructive"}
              onClick={handleStatusToggle}
              disabled={statusToggling}
            >
              {statusToggling ? "处理中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
