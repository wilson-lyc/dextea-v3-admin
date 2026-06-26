import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import type { Product } from "@dextea/shared-types"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { getProductBasicInfo } from "@/services"
import BasicInfoPanel from "./components/BasicInfoPanel"
import TagsPanel from "./components/TagsPanel"
import CustomizationPanel from "./components/CustomizationPanel"
import IngredientPanel from "./components/IngredientPanel"

export default function ProductDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [productName, setProductName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getProductBasicInfo(Number(id))
      .then((res) => {
        if (res.code === 0) {
          setProductName(res.data.name)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !productName) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">商品不存在</p>
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
                <BreadcrumbLink render={<Link to="/products" />}>
                  商品管理
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{productName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col px-6 pb-6 pt-3">
          <Tabs defaultValue="basic">
            <TabsList variant="line">
              <TabsTrigger value="basic">基础信息</TabsTrigger>
              <TabsTrigger value="tags">标签</TabsTrigger>
              <TabsTrigger value="customization">客制化</TabsTrigger>
              <TabsTrigger value="ingredients">原料</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6 flex flex-col gap-6">
              {id && <BasicInfoPanel productId={id} />}
            </TabsContent>

            <TabsContent value="tags" className="mt-6 flex flex-col gap-6">
              {id && <TagsPanel productId={Number(id)} />}
            </TabsContent>

            <TabsContent value="customization" className="mt-6">
              {id && <CustomizationPanel productId={Number(id)} />}
            </TabsContent>

            <TabsContent value="ingredients" className="mt-6">
              {id && <IngredientPanel productId={Number(id)} />}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}
