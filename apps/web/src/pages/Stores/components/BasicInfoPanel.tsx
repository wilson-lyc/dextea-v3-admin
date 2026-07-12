import type { Store } from "@/api"
import { KeyRoundIcon, PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import DetailInfoGrid, { InfoField } from "@/components/layout/DetailInfoGrid"

interface BasicInfoPanelProps {
  store: Store
  /** 打开「编辑基础信息」对话框 */
  onEdit: () => void
  /** 触发「重置密码」 */
  onResetPassword: () => void
}

export default function BasicInfoPanel({ store, onEdit, onResetPassword }: BasicInfoPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>基础信息</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" onClick={onEdit}>
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
  )
}
