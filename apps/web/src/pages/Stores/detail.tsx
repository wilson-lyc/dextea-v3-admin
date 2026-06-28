import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon, PencilIcon, KeyRoundIcon } from "lucide-react"
import { toast } from "sonner"

import type { Store, StoreStatus } from "@dextea/shared-types"
import { STORE_STATUS } from "@dextea/shared-types"

const STORE_STATUS_LABEL: Record<number, string> = {
  [STORE_STATUS.RESTING.value]: "休息中",
  [STORE_STATUS.OPEN.value]: "营业中",
  [STORE_STATUS.PREPARING.value]: "筹备中",
  [STORE_STATUS.CLOSED.value]: "已注销",
}
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
import { getStore, resetStorePassword } from "@/services"
import { EditStatusDialog } from "./components/EditStatusDialog"
import { EditBasicInfoDialog } from "./components/EditBasicInfoDialog"
import { EditLocationDialog } from "./components/EditLocationDialog"
import { ProductsPanel } from "./components/ProductsPanel"
import { CustomizationsPanel } from "./components/CustomizationsPanel"
import { IngredientsPanel } from "./components/IngredientsPanel"

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

  const tabValues = useMemo(() => ["basic", "products", "customizations", "ingredients"], [])
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-1 flex-col min-h-0">
        <div className="shrink-0 px-6">
          <TabsList variant="line">
            <TabsTrigger value="basic">基础信息</TabsTrigger>
            <TabsTrigger value="products">商品</TabsTrigger>
            <TabsTrigger value="customizations">客制化</TabsTrigger>
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
                  <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
                    <span className="text-sm text-muted-foreground">当前状态</span>
                    <span
                      className={`text-sm ${
                        store.status === STORE_STATUS.OPEN.value
                          ? 'text-green-600'
                          : store.status === STORE_STATUS.RESTING.value
                            ? 'text-amber-600'
                            : store.status === STORE_STATUS.PREPARING.value
                              ? 'text-blue-600'
                              : 'text-muted-foreground'
                      }`}
                    >
                      {STORE_STATUS_LABEL[store.status]}
                    </span>
                  </div>
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
                  <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
                    <span className="text-sm text-muted-foreground">门店名称</span>
                    <span className="text-sm">{store.name}</span>

                    <span className="text-sm text-muted-foreground">登录账号</span>
                    <span className="text-sm font-mono">{store.account}</span>

                    <span className="text-sm text-muted-foreground">邮箱</span>
                    <span className="text-sm">{store.email || "-"}</span>

                    <span className="text-sm text-muted-foreground">联系电话</span>
                    <span className="text-sm">{store.phone || "-"}</span>

                    <span className="text-sm text-muted-foreground">营业时间</span>
                    <span className="text-sm">{store.businessHours || "-"}</span>
                  </div>
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
                    <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
                      <span className="text-sm text-muted-foreground">地址</span>
                      <span className="text-sm">{fullAddress}</span>
                    </div>
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
                  <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
                    <span className="text-sm text-muted-foreground">创建时间</span>
                    <span className="text-sm">{formatDate(store.createdAt)}</span>

                    <span className="text-sm text-muted-foreground">更新时间</span>
                    <span className="text-sm">{formatDate(store.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="products" className="flex-1 min-h-0 m-0 p-6">
          {store && <ProductsPanel storeId={store.id} />}
        </TabsContent>

        <TabsContent value="customizations" className="flex-1 min-h-0 m-0 p-6">
          {store && <CustomizationsPanel storeId={store.id} />}
        </TabsContent>

        <TabsContent value="ingredients" className="flex-1 min-h-0 m-0 p-6">
          {store && <IngredientsPanel storeId={store.id} />}
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
          <EditStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            storeId={store.id}
            currentStatus={store.status}
            onUpdated={fetchStore}
          />
          <EditBasicInfoDialog
            open={basicInfoDialogOpen}
            onOpenChange={setBasicInfoDialogOpen}
            store={store}
            onUpdated={fetchStore}
          />
          <EditLocationDialog
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
