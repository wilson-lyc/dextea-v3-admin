import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { getProductBasicInfo } from "@/api"
import DetailLayout from "@/components/layout/DetailLayout"
import BasicInfoPanel from "./components/BasicInfoPanel"
import TagsPanel from "./components/TagsPanel"
import CustomizationPanel from "./components/CustomizationPanel"
import IngredientPanel from "./components/IngredientPanel"

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [productName, setProductName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const tabValues = useMemo(() => ["basic", "tags", "customization", "ingredients"], [])
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace("#", "")
    return tabValues.includes(hash) ? hash : "basic"
  })

  // Sync tab ← hash changes (browser back/forward)
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "")
      if (tabValues.includes(hash)) {
        setActiveTab(hash)
      }
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [tabValues])

  // Sync hash ← tab changes
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value)
      const newHash = value === "basic" ? "" : value
      window.history.replaceState(
        null,
        "",
        newHash ? `#${newHash}` : window.location.pathname,
      )
    },
    [],
  )

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
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-1 min-h-0 flex-col">
        <TabsList variant="line">
          <TabsTrigger value="basic">基础信息</TabsTrigger>
          <TabsTrigger value="tags">标签</TabsTrigger>
          <TabsTrigger value="customization">客制化</TabsTrigger>
          <TabsTrigger value="ingredients">原料</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 p-1">
          {id && <BasicInfoPanel productId={id} />}
        </TabsContent>

        <TabsContent value="tags" className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 p-1">
          {id && <TagsPanel productId={Number(id)} />}
        </TabsContent>

        <TabsContent value="customization" className="flex-1 min-h-0 overflow-y-auto p-1">
          {id && <CustomizationPanel productId={Number(id)} />}
        </TabsContent>

        <TabsContent value="ingredients" className="flex-1 min-h-0 overflow-y-auto p-1">
          {id && <IngredientPanel productId={Number(id)} />}
        </TabsContent>
      </Tabs>
    </DetailLayout>
  )
}
