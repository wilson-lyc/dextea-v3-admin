import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import type { Ingredient } from "@/api"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TabsContent } from "@/components/ui/tabs"
import { DetailTabs } from "@/components/layout/DetailLayout"
import { getIngredient } from "@/api"
import BasicInfoPanel from "./components/BasicInfoPanel"
import ProductBindingPanel from "./components/ProductBindingPanel"
import CustomizationOptionBindingPanel from "./components/CustomizationOptionBindingPanel"

export default function IngredientDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const ingredientId = id ? Number(id) : undefined
  const [ingredient, setIngredient] = useState<Ingredient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ingredientId) return
    setLoading(true)
    getIngredient(ingredientId)
      .then((res) => {
        if (res.code === 0) {
          setIngredient(res.data)
        } else {
          setIngredient(null)
        }
      })
      .catch(() => setIngredient(null))
      .finally(() => setLoading(false))
  }, [ingredientId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (!ingredient) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">原料不存在</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="shrink-0 px-6 pt-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeftIcon data-icon="inline-start" />
            返回
          </Button>
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
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col px-6 pb-6 pt-3">
          <DetailTabs
            className="flex flex-col"
            tabs={[
              { value: "basic", label: "基础信息" },
              { value: "products", label: "商品绑定" },
              { value: "customization", label: "客制化选项绑定" },
            ]}
          >
            <TabsContent value="basic" className="mt-6 gap-6">
              {ingredientId && <BasicInfoPanel ingredientId={ingredientId} />}
            </TabsContent>

            <TabsContent value="products" className="mt-6">
              {ingredientId && <ProductBindingPanel ingredientId={ingredientId} unit={ingredient.unit} />}
            </TabsContent>

            <TabsContent value="customization" className="mt-6">
              {ingredientId && <CustomizationOptionBindingPanel ingredientId={ingredientId} unit={ingredient.unit} />}
            </TabsContent>
          </DetailTabs>
        </div>
      </ScrollArea>
    </div>
  )
}
