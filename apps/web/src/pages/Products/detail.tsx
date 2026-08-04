import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { TabsContent } from "@/components/ui/tabs"
import { getProductBasicInfo } from "@/api"
import { logger, extractBackendMessage } from "@/lib/logger"
import DetailLayout from "@/components/layout/DetailLayout"
import BasicInfoPanel from "./components/BasicInfoPanel"
import TagsPanel from "./components/TagsPanel"
import CustomizationPanel from "./components/CustomizationPanel"
import IngredientPanel from "./components/IngredientPanel"
import ImagePanel from "./components/ImagePanel"

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = id ? Number(id) : undefined
  const [productName, setProductName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    getProductBasicInfo(productId)
      .then((res) => {
        if (res.code === 0) {
          setProductName(res.data.name)
        } else {
          setNotFound(true)
        }
      })
      .catch((err) => {
        logger.error(extractBackendMessage(err) ?? "未知错误", {
          module: "商品",
          label: "获取商品基础信息",
        })
        setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [productId])

  if (loading) {
    return <DetailLayout loading />
  }

  if (notFound || !productName) {
    return <DetailLayout notFound notFoundText="商品不存在" />
  }

  return (
    <DetailLayout
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/products" />}>
                商品
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{productName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
      tabs={[
        { value: "basic", label: "基础信息", scrollable: true },
        { value: "tags", label: "标签" },
        { value: "customization", label: "客制化" },
        { value: "ingredients", label: "原料" },
        { value: "images", label: "图片" },
      ]}
    >
      <TabsContent value="basic">
        {productId && <BasicInfoPanel productId={productId} />}
      </TabsContent>

      <TabsContent value="tags">
        {productId && <TagsPanel productId={productId} />}
      </TabsContent>

      <TabsContent value="customization">
        {productId && <CustomizationPanel productId={productId} />}
      </TabsContent>

      <TabsContent value="ingredients">
        {productId && <IngredientPanel productId={productId} />}
      </TabsContent>

      <TabsContent value="images">
        {productId && <ImagePanel productId={productId} />}
      </TabsContent>
    </DetailLayout>
  )
}
