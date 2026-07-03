import { useCallback, useEffect, useState } from "react"
import { PencilIcon } from "lucide-react"

import type { Product } from "@dextea/shared-types"
import { PRODUCT_STATUS } from "@dextea/shared-types"
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TEXT_CLASSES } from "@/lib/status"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { getProductBasicInfo } from "@/services"
import { EditStatusDialog } from "./EditStatusDialog"
import { EditBasicInfoDialog } from "./EditBasicInfoDialog"

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

interface BasicInfoPanelProps {
  productId: string
}

export default function BasicInfoPanel({ productId }: BasicInfoPanelProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)

  const fetchProduct = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await getProductBasicInfo(Number(productId))
      if (res.code === 0) {
        setProduct(res.data)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        加载商品信息失败
      </div>
    )
  }

  return (
    <>
      {/* 商品全局状态 */}
      <Card>
        <CardHeader>
          <CardTitle>商品全局状态</CardTitle>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusDialogOpen(true)}
            >
              <PencilIcon data-icon="inline-start" />
              编辑
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
            <span className="text-sm text-muted-foreground">当前状态</span>
            <span className={`text-sm ${PRODUCT_STATUS_TEXT_CLASSES[product.status] ?? ""}`}>
              {PRODUCT_STATUS_LABEL[product.status]}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 基础信息 */}
      <Card>
        <CardHeader>
          <CardTitle>基础信息</CardTitle>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInfoDialogOpen(true)}
            >
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
            <span className="text-sm tabular-nums">¥ {product.price.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 维护记录 */}
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

      <EditStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        productId={productId}
        currentStatus={product.status}
        onUpdated={fetchProduct}
      />
      <EditBasicInfoDialog
        open={infoDialogOpen}
        onOpenChange={setInfoDialogOpen}
        productId={productId}
        product={product}
        onUpdated={fetchProduct}
      />
    </>
  )
}
