import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeftIcon, Loader2Icon, PencilIcon } from "lucide-react"
import { toast } from "sonner"

import type { Store, StoreStatus } from "@dextea/shared-types"
import { STORE_STATUS_LABEL } from "@dextea/shared-types"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import AmapMap from "@/components/amap-map"
import { getStore } from "@/services"
import { EditStatusDialog } from "./components/EditStatusDialog"
import { EditBasicInfoDialog } from "./components/EditBasicInfoDialog"
import { EditLocationDialog } from "./components/EditLocationDialog"

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

const STATUS_BADGE_CLASSES: Record<StoreStatus, string> = {
  0: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-200 dark:ring-red-800/30",
  1: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-green-200 dark:ring-green-800/30",
  2: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-200 dark:ring-blue-800/30",
  3: "bg-muted text-muted-foreground ring-border",
}

export default function StoreDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [basicInfoDialogOpen, setBasicInfoDialogOpen] = useState(false)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)

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

  useEffect(() => {
    fetchStore()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">门店不存在</p>
        <Button variant="outline" onClick={() => navigate("/stores")}>
          返回门店列表
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/stores")}>
            <ArrowLeftIcon data-icon="inline-start" />
            返回
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/stores">门店管理</Link>
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

      <ScrollArea className="flex-1 min-h-0">
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">当前状态</span>
                  <Badge className={STATUS_BADGE_CLASSES[store.status]}>
                    {STORE_STATUS_LABEL[store.status]}
                  </Badge>
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
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
                <span className="text-sm text-muted-foreground">门店名称</span>
                <span className="text-sm">{store.name}</span>

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
                    暂无位置信息
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

      {store && (
        <>
          <EditStatusDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            currentStatus={store.status}
          />
          <EditBasicInfoDialog
            open={basicInfoDialogOpen}
            onOpenChange={setBasicInfoDialogOpen}
            store={store}
          />
          <EditLocationDialog
            open={locationDialogOpen}
            onOpenChange={setLocationDialogOpen}
            store={store}
          />
        </>
      )}
    </div>
  )
}
