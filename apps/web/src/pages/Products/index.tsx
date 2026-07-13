import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  PackageIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { Product } from "@/api"
import { PRODUCT_STATUS, PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TEXT_CLASSES } from "@dextea-admin/contracts/status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { getProducts, getTagOptions, toggleProductStatus } from "@/api"
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
      const res = await toggleProductStatus(statusConfirmTarget.id, statusConfirmAction)
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
    <>
      <DataTable
        className="p-6"
        toolbarLeft={
          <>
            <Button onClick={handleCreate}>
              <PlusIcon data-icon="inline-start" />
              新增商品
            </Button>
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
                    上架
                  </Button>
                )}
                {product.status === 1 && (
                  <Button
                    variant="outline-destructive"
                    size="sm"
                    onClick={() => openStatusConfirm(product, 0)}
                  >
                    下架
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={products.length === 0}
        colSpan={6}
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
        title={`确认${statusConfirmAction === 1 ? "上架" : "下架"}`}
        description={
          <>
            确定将「{statusConfirmTarget?.name}」更新为
            {statusConfirmAction === 1 ? "上架" : "下架"}吗？
          </>
        }
        confirmText="确认"
        variant={statusConfirmAction === 1 ? "default" : "destructive"}
        loading={statusToggling}
        onConfirm={handleStatusToggle}
      />
    </>
  )
}
