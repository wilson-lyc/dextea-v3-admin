import { useCallback, useEffect, useState } from "react"
import { PencilIcon } from "lucide-react"

import type { Product } from "@/api"
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TEXT_CLASSES } from "@dextea-admin/contracts/status"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import DetailInfoGrid, { InfoField } from "@/components/layout/DetailInfoGrid"
import { getProductBasicInfo } from "@/api"
import { logger, extractBackendMessage } from "@/lib/logger"
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
  productId: number
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
      const res = await getProductBasicInfo(productId)
      if (res.code === 0) {
        setProduct(res.data)
      } else {
        setError(true)
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "获取商品基础信息",
      })
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
    <div className="flex flex-col gap-4">
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
          <DetailInfoGrid>
            <InfoField
              label="当前状态"
              value={PRODUCT_STATUS_LABEL[product.status]}
              valueClassName={PRODUCT_STATUS_TEXT_CLASSES[product.status]}
            />
          </DetailInfoGrid>
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
          <DetailInfoGrid>
            <InfoField label="商品名称" value={product.name} />
            <InfoField label="简介" value={product.brief || "-"} />
            <InfoField label="描述" value={product.description || "-"} />
            <InfoField
              label="价格"
              value={`¥ ${product.price.toFixed(2)}`}
              valueClassName="tabular-nums"
            />
          </DetailInfoGrid>
        </CardContent>
      </Card>

      {/* 维护记录 */}
      <Card>
        <CardHeader>
          <CardTitle>维护记录</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailInfoGrid>
            <InfoField label="创建时间" value={formatDate(product.createdAt)} />
            <InfoField label="更新时间" value={formatDate(product.updatedAt)} />
          </DetailInfoGrid>
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
    </div>
  )
}
