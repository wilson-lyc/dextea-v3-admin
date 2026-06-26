import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import type { ProductCustomization } from "@dextea/shared-types"
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
import { getProductCustomization } from "@/services"
import BasicInfoPanel from "./components/BasicInfoPanel"
import ProductBindingPanel from "./components/ProductBindingPanel"
import CustomizationOptionsPanel from "./components/CustomizationOptionsPanel"

export default function CustomizationDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [item, setItem] = useState<ProductCustomization | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const tabValues = useMemo(() => ["basic", "products", "options"], [])
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

  const fetchItem = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getProductCustomization(Number(id))
      if (res.code === 0) {
        setItem(res.data)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchItem()
  }, [fetchItem])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !item) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">客制化项目不存在</p>
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
                <BreadcrumbLink render={<Link to="/products/customization" />}>
                  客制化项目
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{item.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col px-6 pb-6 pt-3">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList variant="line">
              <TabsTrigger value="basic">基础信息</TabsTrigger>
              <TabsTrigger value="products">商品绑定</TabsTrigger>
              <TabsTrigger value="options">客制化选项</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6">
              {item && <BasicInfoPanel item={item} onUpdated={fetchItem} />}
            </TabsContent>
            <TabsContent value="products" className="mt-6">
              {id && <ProductBindingPanel customizationId={Number(id)} />}
            </TabsContent>
            <TabsContent value="options" className="mt-6">
              {id && <CustomizationOptionsPanel customizationId={Number(id)} />}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}
