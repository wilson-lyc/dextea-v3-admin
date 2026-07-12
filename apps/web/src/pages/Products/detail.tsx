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
import DetailLayout from "@/components/layout/DetailLayout"
import BasicInfoPanel from "./components/BasicInfoPanel"
import TagsPanel from "./components/TagsPanel"
import CustomizationPanel from "./components/CustomizationPanel"
import IngredientPanel from "./components/IngredientPanel"

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
      .catch(() => setNotFound(true))
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
              <BreadcrumbPage>商品管理</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
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
    </DetailLayout>
  )
}
