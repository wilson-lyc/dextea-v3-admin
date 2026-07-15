import { useEffect, useState } from "react"
import { toast } from "sonner"

import type {
  CreateStorageLocationRequest,
  StorageLocation,
  UpdateStorageLocationRequest,
} from "@/api"
import {
  createStorageLocation,
  testStorageLocationConnection,
  updateStorageLocation,
} from "@/api"
import {
  STORAGE_LOCATION_STATUS,
  STORAGE_LOCATION_STATUS_LABEL,
} from "@dextea-admin/contracts/status"
import { STORAGE_PROVIDERS, type StorageProviderValue } from "@dextea-admin/contracts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { StatusSelectPicker } from "@/components/ui/status-select-picker"
import { SelectPicker } from "@/components/ui/select-picker"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FormState {
  name: string
  provider: StorageProviderValue
  region: string
  endpoint: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  publicBaseUrl: string
  forcePathStyle: boolean
  status: number
}

const EMPTY_FORM: FormState = {
  name: "",
  provider: "tencent",
  region: "",
  endpoint: "",
  bucket: "",
  accessKeyId: "",
  secretAccessKey: "",
  publicBaseUrl: "",
  forcePathStyle: false,
  status: 1,
}

interface StorageLocationDialogProps {
  open: boolean
  editing: StorageLocation | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export default function StorageLocationDialog({
  open,
  editing,
  onOpenChange,
  onSaved,
}: StorageLocationDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  // 每次打开弹窗时，根据是否为编辑模式初始化表单
  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        name: editing.name,
        provider: editing.provider,
        region: editing.region,
        endpoint: editing.endpoint,
        bucket: editing.bucket,
        accessKeyId: editing.accessKeyId,
        secretAccessKey: "",
        publicBaseUrl: editing.publicBaseUrl,
        forcePathStyle: editing.forcePathStyle,
        status: editing.status,
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, editing])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // 当前选中厂商的注册信息，用于带出各厂商专属的表单提示与路径风格默认值
  const currentProvider =
    STORAGE_PROVIDERS.find((p) => p.value === form.provider) ?? STORAGE_PROVIDERS[0]

  const handleProviderChange = (value: string) => {
    const def = STORAGE_PROVIDERS.find((p) => p.value === value)
    setField("provider", value as StorageProviderValue)
    if (def) setField("forcePathStyle", def.forcePathStyle)
  }

  const handleSave = async () => {
    if (
      !form.name ||
      !form.region ||
      !form.endpoint ||
      !form.bucket ||
      !form.accessKeyId ||
      !form.publicBaseUrl
    ) {
      toast.error("请填写必填项（名称/区域/端点/桶/SecretId/公网地址）")
      return
    }
    if (!editing && !form.secretAccessKey) {
      toast.error("新增时请填写 SecretKey")
      return
    }

    setSaving(true)
    try {
      if (editing) {
        const payload: UpdateStorageLocationRequest = {
          name: form.name,
          provider: form.provider,
          region: form.region,
          endpoint: form.endpoint,
          bucket: form.bucket,
          accessKeyId: form.accessKeyId,
          forcePathStyle: form.forcePathStyle,
          publicBaseUrl: form.publicBaseUrl,
          status: form.status,
        }
        // secretAccessKey 留空表示保留原值
        if (form.secretAccessKey) payload.secretAccessKey = form.secretAccessKey
        await updateStorageLocation(editing.id, payload)
        toast.success("更新成功")
      } else {
        const payload: CreateStorageLocationRequest = {
          name: form.name,
          provider: form.provider,
          region: form.region,
          endpoint: form.endpoint,
          bucket: form.bucket,
          accessKeyId: form.accessKeyId,
          secretAccessKey: form.secretAccessKey,
          forcePathStyle: form.forcePathStyle,
          publicBaseUrl: form.publicBaseUrl,
          status: form.status,
        }
        await createStorageLocation(payload)
        toast.success("创建成功")
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (
      !form.region ||
      !form.endpoint ||
      !form.bucket ||
      !form.accessKeyId ||
      !form.publicBaseUrl
    ) {
      toast.error("请先填写区域/端点/桶/SecretId/公网地址")
      return
    }
    if (!form.secretAccessKey) {
      toast.error(
        editing ? "编辑模式下测试请重新填写 SecretKey" : "请填写 SecretKey 后再测试",
      )
      return
    }

    setTesting(true)
    try {
      const res = await testStorageLocationConnection({
        region: form.region,
        provider: form.provider,
        endpoint: form.endpoint,
        bucket: form.bucket,
        accessKey: form.accessKey,
        secretKey: form.secretKey,
        forcePathStyle: form.forcePathStyle,
        publicBaseUrl: form.publicBaseUrl,
      })
      if (res.data.ok) toast.success(res.data.message || "连接成功")
      else toast.error(res.data.message || "连接失败")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "测试失败")
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "编辑存储位置" : "新增存储位置"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>厂商</Label>
              <SelectPicker
                options={STORAGE_PROVIDERS.map((p) => ({ label: p.label, value: p.value }))}
                value={form.provider}
                onValueChange={handleProviderChange}
                placeholder="请选择存储厂商"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>位置名称</Label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{currentProvider.regionLabel}</Label>
              <Input
                value={form.region}
                onChange={(e) => setField("region", e.target.value)}
                placeholder={currentProvider.regionPlaceholder}
              />
            </div>

            <div className="space-y-1.5">
              <Label>存储桶名称</Label>
              <Input
                value={form.bucket}
                onChange={(e) => setField("bucket", e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Endpoint（地域节点）</Label>
              <Input
                value={form.endpoint}
                onChange={(e) => setField("endpoint", e.target.value)}
                placeholder={currentProvider.endpointPlaceholder}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>SecretId</Label>
              <Input
                value={form.accessKeyId}
                onChange={(e) => setField("accessKeyId", e.target.value)}
                placeholder={editing ? "置空表示不修改" : ""}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>SecretKey</Label>
              <Input
                type="password"
                value={form.secretAccessKey}
                onChange={(e) => setField("secretAccessKey", e.target.value)}
                placeholder={editing ? "置空表示不修改" : ""}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>访问域名</Label>
              <Input
                value={form.publicBaseUrl}
                onChange={(e) => setField("publicBaseUrl", e.target.value)}
                placeholder={currentProvider.publicBaseUrlPlaceholder}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>状态</Label>
              <StatusSelectPicker
                statusEnum={STORAGE_LOCATION_STATUS}
                labels={STORAGE_LOCATION_STATUS_LABEL}
                value={String(form.status)}
                onValueChange={(v) => setField("status", Number(v))}
                placeholder="请选择状态"
                className="w-full"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? "测试中..." : "测试连接"}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
