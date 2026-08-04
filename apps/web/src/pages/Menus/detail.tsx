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
import { getMenu } from "@/api"
import DetailLayout from "@/components/layout/DetailLayout"
import BasicInfoPanel from "./components/BasicInfoPanel"
import GroupsPanel from "./components/GroupsPanel"

export default function MenuDetailPage() {
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

  return (
    <DetailLayout
      loading={loading}
      notFound={notFound}
      notFoundText="菜单不存在"
      breadcrumb={
        menuName && (
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/menus" />}>
                  菜单管理
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{menuName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )
      }
      tabs={[
        { value: "basic", label: "基础信息", scrollable: true },
        { value: "groups", label: "菜单分组" },
      ]}
    >
      <TabsContent value="basic">
        {menuId && <BasicInfoPanel menuId={menuId} />}
      </TabsContent>

      <TabsContent value="groups">
        {menuId && <GroupsPanel menuId={menuId} />}
      </TabsContent>
    </DetailLayout>
  )
}
