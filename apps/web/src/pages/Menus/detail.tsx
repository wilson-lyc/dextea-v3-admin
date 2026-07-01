import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
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
import { getMenu } from "@/services"
import BasicInfoPanel from "./components/BasicInfoPanel"
import GroupsPanel from "./components/GroupsPanel"

export default function MenuDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [menuName, setMenuName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const tabValues = useMemo(() => ["basic", "groups"], [])
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
    getMenu(Number(id))
      .then((res) => {
        if (res.code === 0) {
          setMenuName(res.data.name)
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

  if (notFound || !menuName) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">菜单不存在</p>
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
                <BreadcrumbPage>菜单管理</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{menuName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex h-full flex-col px-6 pb-6 pt-3">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex min-h-0 flex-1 flex-col">
            <TabsList variant="line">
              <TabsTrigger value="basic">基础信息</TabsTrigger>
              <TabsTrigger value="groups">菜单分组</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6 flex flex-col gap-6">
              {id && <BasicInfoPanel menuId={id} />}
            </TabsContent>

            <TabsContent value="groups" className="mt-6 flex min-h-0 flex-1 flex-col gap-4">
              {id && <GroupsPanel menuId={id} />}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}
