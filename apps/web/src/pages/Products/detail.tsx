import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import type { Product, ProductStatus } from "@dextea/shared-types"
import { getProductStatusLabel } from "@dextea/shared-types"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getProduct, removeProductTag } from "@/services"
import { EditStatusDialog } from "./components/EditStatusDialog"
import { EditBasicInfoDialog } from "./components/EditBasicInfoDialog"
import { AddTagDialog } from "./components/AddTagDialog"

function formatDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const STATUS_BADGE_CLASSES: Record<ProductStatus, string> = {
  0: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30",
  1: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30",
}

export default function ProductDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [addTagDialogOpen, setAddTagDialogOpen] = useState(false)

  const fetchProduct = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getProduct(Number(id))
      if (res.code === 0) {
        setProduct(res.data)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取商品信息失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProduct()
  }, [id])

  const handleRemoveTag = async (tagId: number) => {
    if (!product) return
    try {
      const res = await removeProductTag(product.id, tagId)
      if (res.code === 0) {
        toast.success(res.message)
        await fetchProduct()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除标签失败")
    }
  }

  // ── Render ──
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">商品不存在</p>
        <Button variant="outline" onClick={() => navigate("/products")}>
          返回商品列表
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="shrink-0 px-6 pt-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>
            <ArrowLeftIcon data-icon="inline-start" />
            返回
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/products">商品管理</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-6 px-6 pb-6 pt-3">
          {/* ── 商品状态 ── */}
          <Card>
            <CardHeader>
              <CardTitle>商品状态</CardTitle>
              <CardAction>
                <Button variant="ghost" size="sm" onClick={() => setStatusDialogOpen(true)}>
                  <PencilIcon data-icon="inline-start" />
                  编辑
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">当前状态</span>
                <Badge className={STATUS_BADGE_CLASSES[product.status]}>
                  {getProductStatusLabel(product.status)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* ── 基础信息 ── */}
          <Card>
            <CardHeader>
              <CardTitle>基础信息</CardTitle>
              <CardAction>
                <Button variant="ghost" size="sm" onClick={() => setInfoDialogOpen(true)}>
                  <PencilIcon data-icon="inline-start" />
                  编辑
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
                <span className="text-sm text-muted-foreground">商品名称</span>
                <span className="text-sm">{product.name}</span>

                <span className="text-sm text-muted-foreground">简介</span>
                <span className="text-sm">{product.brief || "-"}</span>

                <span className="text-sm text-muted-foreground">描述</span>
                <span className="text-sm">{product.description || "-"}</span>

                <span className="text-sm text-muted-foreground">价格</span>
                <span className="text-sm">¥{product.price.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* ── 标签 ── */}
          <Card>
            <CardHeader>
              <CardTitle>标签</CardTitle>
              <CardAction>
                <Button variant="ghost" size="sm" onClick={() => setAddTagDialogOpen(true)}>
                  <PlusIcon data-icon="inline-start" />
                  新增
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标签名称</TableHead>
                    <TableHead className="w-24 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!product.tags || product.tags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                        暂无标签
                      </TableCell>
                    </TableRow>
                  ) : (
                    product.tags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">{tag.name}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-500"
                            onClick={() => handleRemoveTag(tag.id)}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* ── 维护记录 ── */}
          <Card>
            <CardHeader>
              <CardTitle>维护记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
                <span className="text-sm text-muted-foreground">创建时间</span>
                <span className="text-sm">{formatDate(product.createdAt)}</span>

                <span className="text-sm text-muted-foreground">更新时间</span>
                <span className="text-sm">{formatDate(product.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {product && id && (
        <>
          <EditStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            productId={id}
            currentStatus={product.status}
            onUpdated={fetchProduct}
          />
          <EditBasicInfoDialog
            open={infoDialogOpen}
            onOpenChange={setInfoDialogOpen}
            productId={id}
            product={product}
            onUpdated={fetchProduct}
          />
          <AddTagDialog
            open={addTagDialogOpen}
            onOpenChange={setAddTagDialogOpen}
            productId={product.id}
            existingTagIds={product.tags?.map((t) => t.id) ?? []}
            onAdded={fetchProduct}
          />
        </>
      )}
    </div>
  )
}
