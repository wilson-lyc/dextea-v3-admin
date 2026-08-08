import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ChevronDownIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { Product } from "@/api"
import { PRODUCT_STATUS, PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TEXT_CLASSES } from "@dextea-admin/contracts/status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { batchUpdateProductStatus, getProducts, getTagOptions, toggleProductStatus } from "@/api"
import { logger, extractBackendMessage } from "@/lib/logger"
import { SelectPicker } from "@/components/ui/select-picker"
import { CreateProductDialog } from "./components/CreateProductDialog"
import DataTable from "@/components/ui/data-table"

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

  const [selectedTag, setSelectedTag] = useState("")

  const [tagOptions, setTagOptions] = useState<Array<{ label: string; value: string }>>([])

  const filterRef = useRef({ filterStatus: "", selectedTag: "" })
  filterRef.current = { filterStatus, selectedTag }

  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false)
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<{ id: number; name: string } | null>(null)
  const [statusConfirmAction, setStatusConfirmAction] = useState<0 | 1>(0)
  const [statusToggling, setStatusToggling] = useState(false)

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

  useEffect(() => {
    getTagOptions()
      .then((res) => {
        if (res.code === 0) setTagOptions(res.data)
      })
      .catch((err) => {
        logger.error(extractBackendMessage(err) ?? "未知错误", {
          module: "商品",
          label: "获取标签选项",
        })
      })
  }, [])

  const hasFilters = !!(keyword || filterStatus || selectedTag)

  const fetchProducts = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const kw = keywordRef.current
      const { filterStatus, selectedTag } = filterRef.current
      const params: {
        page?: number; pageSize?: number; keyword?: string;
        status?: number; tagIds?: string;
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
      if (selectedTag) {
        params.tagIds = selectedTag
      }
      const res = await getProducts(params)
      setProducts(res.data.items)
      setTotal(res.data.total)
      setPage(targetPage)
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "获取商品列表",
      })
      toast.error("数据加载异常，请稍后重试")
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
    setSelectedTag("")
    keywordRef.current = ""
    filterRef.current = { filterStatus: "", selectedTag: "" }
    fetchProducts(1)
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
      const res = await toggleProductStatus(statusConfirmTarget.id, statusConfirmAction)
      if (res.code === 0) {
        toast.success(res.message || "更新商品状态成功")
        setStatusConfirmOpen(false)
        setStatusConfirmTarget(null)
        await fetchProducts(page)
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "更新商品状态",
      })
      toast.error("更新商品状态失败，请稍后重试")
    } finally {
      setStatusToggling(false)
    }
  }

  const openBatchConfirm = (targetStatus: 0 | 1) => {
    if (selectedIds.size === 0) return
    setBatchConfirmAction(targetStatus)
    setBatchConfirmOpen(true)
  }

  const handleBatchStatusUpdate = async () => {
    if (selectedIds.size === 0) return
    setBatchUpdating(true)
    try {
      const res = await batchUpdateProductStatus([...selectedIds], batchConfirmAction)
      if (res.code === 0) {
        toast.success(res.message || `已批量更新 ${res.data.updatedCount} 个商品状态`)
        setBatchConfirmOpen(false)
        setSelectedIds(new Set())
        await fetchProducts(page)
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "批量更新商品状态",
      })
      toast.error("批量更新商品状态失败，请稍后重试")
    } finally {
      setBatchUpdating(false)
    }
  }

  return (
    <>
      <DataTable
        className="p-6"
        toolbarLeft={
          <>
            <Button onClick={handleCreate}>
              <PlusIcon data-icon="inline-start" />
              新增商品
            </Button>
            {selectedIds.size > 0 && (
              <div
                className="flex items-center gap-2"
                onMouseLeave={scheduleCloseBatchMenu}
              >
                <DropdownMenu open={batchMenuOpen} onOpenChange={setBatchMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      onMouseEnter={openBatchMenu}
                      onClick={openBatchMenu}
                    >
                      操作
                      <ChevronDownIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    onMouseEnter={openBatchMenu}
                    onMouseLeave={scheduleCloseBatchMenu}
                  >
                    <DropdownMenuItem onClick={() => openBatchConfirm(1)}>
                      批量全局上架
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => openBatchConfirm(0)}
                    >
                      批量全局下架
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </>
        }
        toolbarRight={
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
                ...Object.values(PRODUCT_STATUS).map((s) => ({
                  label: s.label,
                  value: String(s.value),
                })),
              ]}
              value={filterStatus}
              onValueChange={setFilterStatus}
              placeholder="状态"
              className="w-28"
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
        }
        header={
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              <TableHead className="w-24">商品ID</TableHead>
              <TableHead>商品名称</TableHead>
              <TableHead>价格</TableHead>
              <TableHead>全局状态</TableHead>
              <TableHead>标签</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={products.map((product) => (
          <TableRow key={product.id} data-id={product.id}>
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
                  管理
                </Button>
                {product.status === 0 && (
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => openStatusConfirm(product, 1)}
                  >
                    全局上架
                  </Button>
                )}
                {product.status === 1 && (
                  <Button
                    variant="outline-destructive"
                    size="sm"
                    onClick={() => openStatusConfirm(product, 0)}
                  >
                    全局下架
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={products.length === 0}
        colSpan={6}
        showSelection
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRefresh={() => refreshProducts(page)}
        refreshDisabled={loading}
        emptyIcon={<PackageIcon className="size-4" />}
        emptyText="暂无数据"
        pagination={{ page, pageSize, total, onPageChange: fetchProducts }}
      />

      <CreateProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => fetchProducts(page)}
      />

      <ConfirmDialog
        open={statusConfirmOpen}
        onOpenChange={setStatusConfirmOpen}
        title="操作确认"
        description={
          <>
            确定修改「{statusConfirmTarget?.name}」的全局状态为「{statusConfirmAction === 1 ? "全局上架" : "全局下架"}」吗？
          </>
        }
        loading={statusToggling}
        onConfirm={handleStatusToggle}
      />

      <ConfirmDialog
        open={batchConfirmOpen}
        onOpenChange={setBatchConfirmOpen}
        title="操作确认"
        description={
          <>
            确定将 {selectedIds.size} 个商品批量{batchConfirmAction === 1 ? "上架" : "下架"}吗？
          </>
        }
        confirmText="确定"
        cancelText="取消"
        loading={batchUpdating}
        onConfirm={handleBatchStatusUpdate}
      />
    </>
  )
}
