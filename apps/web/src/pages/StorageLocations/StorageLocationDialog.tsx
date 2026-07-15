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
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FormState {
  name: string
  provider: string
  region: string
  endpoint: string
  bucket: string
  accessKey: string
  secretKey: string
  publicBaseUrl: string
  forcePathStyle: boolean
  status: number
}

const EMPTY_FORM: FormState = {
  name: "",
  provider: "aliyun",
  region: "",
  endpoint: "",
  bucket: "",
  accessKey: "",
  secretKey: "",
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
        accessKey: editing.accessKey,
        secretKey: "",
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

  const handleSave = async () => {
    if (
      !form.name ||
      !form.region ||
      !form.endpoint ||
      !form.bucket ||
      !form.accessKey ||
      !form.publicBaseUrl
    ) {
      toast.error("请填写必填项（名称/区域/端点/桶/AccessKey/公网地址）")
      return
    }
    if (!editing && !form.secretKey) {
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
          accessKey: form.accessKey,
          forcePathStyle: form.forcePathStyle,
          publicBaseUrl: form.publicBaseUrl,
          status: form.status,
        }
        // secretKey 留空表示保留原值
        if (form.secretKey) payload.secretKey = form.secretKey
        await updateStorageLocation(editing.id, payload)
        toast.success("更新成功")
      } else {
        const payload: CreateStorageLocationRequest = {
          name: form.name,
          provider: form.provider,
          region: form.region,
          endpoint: form.endpoint,
          bucket: form.bucket,
          accessKey: form.accessKey,
          secretKey: form.secretKey,
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
      !form.accessKey ||
      !form.publicBaseUrl
    ) {
      toast.error("请先填写区域/端点/桶/AccessKey/公网地址")
      return
    }
    if (!form.secretKey) {
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
              <Label>名称</Label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="如：阿里云 OSS-华东"
              />
            </div>

            <div className="space-y-1.5">
              <Label>区域</Label>
              <Input
                value={form.region}
                onChange={(e) => setField("region", e.target.value)}
                placeholder="如：oss-cn-hangzhou"
              />
            </div>

            <div className="space-y-1.5">
              <Label>存储桶</Label>
              <Input
                value={form.bucket}
                onChange={(e) => setField("bucket", e.target.value)}
                placeholder="bucket-name"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>端点（Endpoint）</Label>
              <Input
                value={form.endpoint}
                onChange={(e) => setField("endpoint", e.target.value)}
                placeholder="https://oss-cn-hangzhou.aliyuncs.com"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>AccessKey</Label>
              <Input
                value={form.accessKey}
                onChange={(e) => setField("accessKey", e.target.value)}
                placeholder="AKID..."
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>
                SecretKey
                {editing && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    （留空表示保留原值）
                  </span>
                )}
              </Label>
              <Input
                type="password"
                value={form.secretKey}
                onChange={(e) => setField("secretKey", e.target.value)}
                placeholder={editing ? "保留原值" : "SK..."}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>公网基础地址（Public Base URL）</Label>
              <Input
                value={form.publicBaseUrl}
                onChange={(e) => setField("publicBaseUrl", e.target.value)}
                placeholder="https://my-bucket.oss-cn-hangzhou.aliyuncs.com"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>
                厂商
                <span className="ml-1 text-xs text-muted-foreground">
                  （选填，仅用于标识）
                </span>
              </Label>
              <Input
                value={form.provider}
                onChange={(e) => setField("provider", e.target.value)}
                placeholder="如：aliyun / aws / minio / generic"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.forcePathStyle}
                onCheckedChange={(v) => setField("forcePathStyle", v)}
              />
              强制路径风格（MinIO 等通常需要开启）
            </label>

            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.status === 1}
                onCheckedChange={(v) => setField("status", v ? 1 : 0)}
              />
              启用
            </label>
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
