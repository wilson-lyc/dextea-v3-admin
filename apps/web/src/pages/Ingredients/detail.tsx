import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import type { Ingredient } from "@/api"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { TabsContent } from "@/components/ui/tabs"
import { getIngredient } from "@/api"
import DetailLayout from "@/components/layout/DetailLayout"
import BasicInfoPanel from "./components/BasicInfoPanel"
import RelatedProductPanel from "./components/RelatedProductPanel"
import RelatedCustomizationOptionPanel from "./components/RelatedCustomizationOptionPanel"

export default function IngredientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const ingredientId = id ? Number(id) : undefined
  const [ingredient, setIngredient] = useState<Ingredient | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!ingredientId) return
    setLoading(true)
    getIngredient(ingredientId)
      .then((res) => {
        if (res.code === 0) {
          setIngredient(res.data)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [ingredientId])

  if (loading) {
    return <DetailLayout loading />
  }

  if (notFound || !ingredient) {
    return <DetailLayout notFound notFoundText="原料不存在" />
  }

  return (
    <DetailLayout
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/products/ingredients" />}>
                原料管理
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{ingredient.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
      tabs={[
        { value: "basic", label: "基础信息", scrollable: true },
        { value: "products", label: "关联商品" },
        { value: "customization", label: "关联客制化选项" },
      ]}
    >
      <TabsContent value="basic">
        {ingredientId && <BasicInfoPanel ingredientId={ingredientId} />}
      </TabsContent>

      <TabsContent value="products">
        {ingredientId && (
          <RelatedProductPanel ingredientId={ingredientId} unit={ingredient.unit} />
        )}
      </TabsContent>

      <TabsContent value="customization">
        {ingredientId && (
          <RelatedCustomizationOptionPanel
            ingredientId={ingredientId}
            unit={ingredient.unit}
          />
        )}
      </TabsContent>
    </DetailLayout>
  )
}
