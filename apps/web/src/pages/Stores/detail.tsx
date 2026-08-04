import { useEffect, useState } from "react"
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
import { TabsContent } from "@/components/ui/tabs"
import DetailLayout from "@/components/layout/DetailLayout"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { getStore, resetStorePassword } from "@/api"
import { logger, extractBackendMessage } from "@/lib/logger"
import { BasicInfoPanel } from "./components/BasicInfoPanel"
import { StoreProductStatusPanel } from "./components/StoreProductStatusPanel"
import { StoreIngredientPanel } from "./components/StoreIngredientPanel"

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [resetting, setResetting] = useState(false)

  const fetchStore = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getStore(Number(id))
      if (res.code === 0) {
        setStore(res.data)
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "门店",
        label: "获取门店详情",
      })
      toast.error("获取门店信息失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = () => {
    setResetConfirmOpen(true)
  }

  const handleConfirmReset = async () => {
    if (!id) return
    setResetting(true)
    try {
      const res = await resetStorePassword(Number(id))
      if (res.code === 0) {
        setResetConfirmOpen(false)
        setNewPassword(res.data.newPassword)
        setPasswordDialogOpen(true)
        fetchStore()
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "门店",
        label: "重置门店密码",
      })
      toast.error("重置密码失败，请稍后重试")
    } finally {
      setResetting(false)
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
      tabs={[
        { value: "basic", label: "基础信息", scrollable: true },
        { value: "products", label: "商品状态" },
        { value: "ingredients", label: "原料库存" },
      ]}
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
      <TabsContent value="basic">
        {store && (
          <BasicInfoPanel
            store={store}
            onUpdated={fetchStore}
            onResetPassword={handleResetPassword}
          />
        )}
      </TabsContent>

      <TabsContent value="products">
        {store && <StoreProductStatusPanel storeId={store.id} />}
      </TabsContent>

      <TabsContent value="ingredients">
        {store && <StoreIngredientPanel storeId={store.id} />}
      </TabsContent>

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
              已生成新的登录密码，此密码仅显示一次，关闭后将不再显示
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => setPasswordDialogOpen(false)}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirm Dialog */}
      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="重置密码"
        description={`确定重置门店「${store?.name}」的登录密码吗？重置后将生成新的登录密码。`}
        variant="default"
        loading={resetting}
        onConfirm={handleConfirmReset}
      />
    </DetailLayout>
  )
}
