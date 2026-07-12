import { useState } from "react"
import type { Store } from "@/api"
import { KeyRoundIcon, PencilIcon } from "lucide-react"
import { STORE_STATUS_LABEL, STORE_STATUS_TEXT_CLASSES } from "@dextea-admin/contracts/status"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import DetailInfoGrid, { InfoField } from "@/components/layout/DetailInfoGrid"
import AmapMap from "@/components/amap"
import { EditStoreStatusDialog } from "./EditStoreStatusDialog"
import { EditStoreBasicInfoDialog } from "./EditStoreBasicInfoDialog"
import { EditStoreLocationDialog } from "./EditStoreLocationDialog"

interface BasicInfoPanelProps {
  store: Store
  /** 数据更新后的回调（用于刷新页面门店数据） */
  onUpdated: () => void
  /** 触发「重置密码」 */
  onResetPassword: () => void
}

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

export function BasicInfoPanel({
  store,
  onUpdated,
  onResetPassword,
}: BasicInfoPanelProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [basicInfoDialogOpen, setBasicInfoDialogOpen] = useState(false)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)

  const fullAddress = [store.province, store.city, store.district, store.address]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="flex flex-col gap-4">
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
            <Button variant="ghost" size="sm" onClick={onResetPassword}>
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

      <EditStoreStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        storeId={store.id}
        currentStatus={store.status}
        onUpdated={onUpdated}
      />
      <EditStoreBasicInfoDialog
        open={basicInfoDialogOpen}
        onOpenChange={setBasicInfoDialogOpen}
        store={store}
        onUpdated={onUpdated}
      />
      <EditStoreLocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        store={store}
        onUpdated={onUpdated}
      />
    </div>
  )
}
