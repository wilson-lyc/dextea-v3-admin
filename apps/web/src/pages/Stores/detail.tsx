import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon, PencilIcon, KeyRoundIcon } from "lucide-react"
import { toast } from "sonner"

import type { Store } from "@/api"
import { STORE_STATUS_LABEL, STORE_STATUS_TEXT_CLASSES } from "@dextea-admin/contracts/status"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import AmapMap from "@/components/amap"
import DetailInfoGrid, { InfoField } from "@/components/layout/DetailInfoGrid"
import { getStore, resetStorePassword } from "@/api"
import { EditStoreStatusDialog } from "./components/EditStoreStatusDialog"
import { EditStoreBasicInfoDialog } from "./components/EditStoreBasicInfoDialog"
import { EditStoreLocationDialog } from "./components/EditStoreLocationDialog"
import { StoreProductsPanel } from "./components/StoreProductsPanel"
import { StoreIngredientsPanel } from "./components/StoreIngredientsPanel"

function formatDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function StoreDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [basicInfoDialogOpen, setBasicInfoDialogOpen] = useState(false)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")

  const tabValues = useMemo(() => ["basic", "products", "ingredients"], [])
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

  const fetchStore = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getStore(Number(id))
      if (res.code === 0) {
        setStore(res.data)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取门店信息失败")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!id) return
    try {
      const res = await resetStorePassword(Number(id))
      if (res.code === 0) {
        setNewPassword(res.data.newPassword)
        setPasswordDialogOpen(true)
        fetchStore()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "重置密码失败")
    }
  }

  useEffect(() => {
    fetchStore()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">门店不存在</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>
    )
  }

  const fullAddress = [store.province, store.city, store.district, store.address]
    .filter(Boolean)
    .join(" ")

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
                <BreadcrumbLink render={<Link to="/stores" />}>
                  门店管理
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{store.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-1 flex-col min-h-0 min-w-0">
        <div className="shrink-0 px-6">
          <TabsList variant="line">
            <TabsTrigger value="basic">基础信息</TabsTrigger>
            <TabsTrigger value="products">商品</TabsTrigger>
            <TabsTrigger value="ingredients">原料</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="basic" className="flex-1 min-h-0 m-0">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-6 px-6 pb-6 pt-3">
              <Card>
                <CardHeader>
                  <CardTitle>门店状态</CardTitle>
                  <CardAction>
                    <Button variant="ghost" size="sm" onClick={() => setStatusDialogOpen(true)}>
                      <PencilIcon data-icon="inline-start" />
                      编辑
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <DetailInfoGrid>
                    <InfoField
                      label="当前状态"
                      value={STORE_STATUS_LABEL[store.status]}
                      valueClassName={STORE_STATUS_TEXT_CLASSES[store.status]}
                    />
                  </DetailInfoGrid>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>基础信息</CardTitle>
                  <CardAction>
                    <Button variant="ghost" size="sm" onClick={() => setBasicInfoDialogOpen(true)}>
                      <PencilIcon data-icon="inline-start" />
                      编辑
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleResetPassword}>
                      <KeyRoundIcon data-icon="inline-start" />
                      重置密码
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <DetailInfoGrid>
                    <InfoField label="门店名称" value={store.name} />
                    <InfoField label="登录账号" value={store.account} valueClassName="font-mono" />
                    <InfoField label="邮箱" value={store.email || "-"} />
                    <InfoField label="联系电话" value={store.phone || "-"} />
                    <InfoField label="营业时间" value={store.businessHours || "-"} />
                  </DetailInfoGrid>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>门店位置</CardTitle>
                  <CardAction>
                    <Button variant="ghost" size="sm" onClick={() => setLocationDialogOpen(true)}>
                      <PencilIcon data-icon="inline-start" />
                      编辑
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <DetailInfoGrid>
                      <InfoField label="地址" value={fullAddress} />
                    </DetailInfoGrid>
                    {store.longitude && store.latitude ? (
                      <AmapMap
                        longitude={store.longitude}
                        latitude={store.latitude}
                        name={store.name}
                        address={fullAddress}
                      />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
                        暂无数据
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>维护记录</CardTitle>
                </CardHeader>
                <CardContent>
                  <DetailInfoGrid>
                    <InfoField label="创建时间" value={formatDate(store.createdAt)} />
                    <InfoField label="更新时间" value={formatDate(store.updatedAt)} />
                  </DetailInfoGrid>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="products" className="flex-1 min-h-0 min-w-0 m-0 p-6">
          {store && <StoreProductsPanel storeId={store.id} />}
        </TabsContent>

        <TabsContent value="ingredients" className="flex-1 min-h-0 min-w-0 m-0 p-6">
          {store && <StoreIngredientsPanel storeId={store.id} />}
        </TabsContent>
      </Tabs>

      {/* Reset Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>密码重置成功</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-4">
            <div className="rounded-lg border bg-muted px-6 py-3 font-mono text-lg tracking-widest">
              {newPassword}
            </div>
            <p className="text-xs text-destructive font-medium">
              此密码仅显示一次，关闭后将不再显示
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => setPasswordDialogOpen(false)}>
              我已保存，关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {store && (
        <>
          <EditStoreStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            storeId={store.id}
            currentStatus={store.status}
            onUpdated={fetchStore}
          />
          <EditStoreBasicInfoDialog
            open={basicInfoDialogOpen}
            onOpenChange={setBasicInfoDialogOpen}
            store={store}
            onUpdated={fetchStore}
          />
          <EditStoreLocationDialog
            open={locationDialogOpen}
            onOpenChange={setLocationDialogOpen}
            store={store}
            onUpdated={fetchStore}
          />
        </>
      )}
    </div>
  )
}
