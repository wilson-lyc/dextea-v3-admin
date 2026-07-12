import { useEffect, useState } from "react"
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
import { TabsContent } from "@/components/ui/tabs"
import { DetailTabs } from "@/components/layout/DetailLayout"
import { getMenu } from "@/api"
import BasicInfoPanel from "./components/BasicInfoPanel"
import GroupsPanel from "./components/GroupsPanel"
import StoresPanel from "./components/StoresPanel"

export default function MenuDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const menuId = id ? Number(id) : undefined
  const [menuName, setMenuName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // 加载菜单数据
  useEffect(() => {
    if (!menuId) return
    setLoading(true)
    getMenu(menuId)
      .then((res) => {
        if (res.code === 0) {
          setMenuName(res.data.name)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [menuId])

  // 加载中
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  // 菜单不存在
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
    <div className="h-full p-6 flex flex-col gap-3">
      {/* 顶栏：返回按钮与面包屑 */}
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

      {/* Tab 面板 */}
      <DetailTabs
      tabs={[
        { value: "basic", label: "基础信息", scrollable: true },
        { value: "groups", label: "菜单分组", scrollable: true },
        { value: "stores", label: "关联门店" },
      ]}
      >
        <TabsContent value="basic">
          {menuId && <BasicInfoPanel menuId={menuId} />}
        </TabsContent>

        <TabsContent value="groups">
          {menuId && <GroupsPanel menuId={menuId} />}
        </TabsContent>

        <TabsContent value="stores">
          {menuId && <StoresPanel menuId={menuId} menuName={menuName} />}
        </TabsContent>
      </DetailTabs>
    </div>
  )
}
