import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"

import type { Store } from "@/api"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DetailLayout from "@/components/layout/DetailLayout"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { getStore, resetStorePassword } from "@/api"
import { BasicInfoPanel } from "./components/BasicInfoPanel"
import { StoreProductsPanel } from "./components/StoreProductsPanel"
import { StoreIngredientsPanel } from "./components/StoreIngredientsPanel"

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
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

  return (
    <DetailLayout
      loading={loading}
      notFound={!store}
      notFoundText="门店不存在"
      breadcrumb={
        store && (
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
        )
      }
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-1 min-h-0 flex-col">
        <TabsList variant="line">
          <TabsTrigger value="basic">基础信息</TabsTrigger>
          <TabsTrigger value="products">商品</TabsTrigger>
          <TabsTrigger value="ingredients">原料</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="flex-1 min-h-0 overflow-y-auto p-1">
          {store && (
            <BasicInfoPanel
              store={store}
              onUpdated={fetchStore}
              onResetPassword={handleResetPassword}
            />
          )}
        </TabsContent>

        <TabsContent value="products" className="flex-1 min-h-0 min-w-0 overflow-y-auto p-1">
          {store && <StoreProductsPanel storeId={store.id} />}
        </TabsContent>

        <TabsContent value="ingredients" className="flex-1 min-h-0 min-w-0 overflow-y-auto p-1">
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
    </DetailLayout>
  )
}
