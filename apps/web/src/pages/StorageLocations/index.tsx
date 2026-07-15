import { useCallback, useEffect, useRef, useState } from "react"
import {
  HardDriveIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import {
  STORAGE_LOCATION_STATUS,
  STORAGE_LOCATION_STATUS_LABEL,
  STORAGE_LOCATION_STATUS_TEXT_CLASSES,
} from "@dextea-admin/contracts"
import type {
  CreateStorageLocationRequest,
  StorageLocation,
  UpdateStorageLocationRequest,
} from "@/api"
import {
  createStorageLocation,
  deleteStorageLocation,
  getStorageLocations,
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
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import DataTable from "@/components/ui/data-table"
import ConfirmDialog from "@/components/ui/confirm-dialog"

const PAGE_SIZE = 20

const PROVIDERS = [
  { value: "aws", label: "AWS S3" },
  { value: "aliyun", label: "阿里云 OSS" },
  { value: "tencent", label: "腾讯云 COS" },
  { value: "minio", label: "MinIO" },
  { value: "generic", label: "通用 S3 兼容" },
]

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

export default function StorageLocationsPage() {
  const [list, setList] = useState<StorageLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const keywordRef = useRef("")
  keywordRef.current = searchKeyword

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<StorageLocation | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<StorageLocation | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchList = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getStorageLocations({
        page: targetPage,
        pageSize: PAGE_SIZE,
        ...(keywordRef.current.trim()
          ? { keyword: keywordRef.current.trim() }
          : {}),
      })
      setList(res.data.items)
      setTotal(res.data.total)
      setPage(targetPage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取列表失败")
    } finally {
      setLoading(false)
    }
  }, [])

  // 刷新（与员工/商品列表风格一致：等待 1 秒后重载）
  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await fetchList(page)
    toast.success("刷新成功")
  }, [fetchList, page])

  useEffect(() => {
    fetchList(1)
  }, [fetchList])

  const handleSearch = () => {
    setKeyword(keywordRef.current)
    setSearchKeyword(keywordRef.current)
    fetchList(1)
  }

  const handleClear = () => {
    setKeyword("")
    setSearchKeyword("")
    keywordRef.current = ""
    fetchList(1)
  }

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (loc: StorageLocation) => {
    setEditing(loc)
    setForm({
      name: loc.name,
      provider: loc.provider,
      region: loc.region,
      endpoint: loc.endpoint,
      bucket: loc.bucket,
      accessKey: loc.accessKey,
      secretKey: "",
      publicBaseUrl: loc.publicBaseUrl,
      forcePathStyle: loc.forcePathStyle,
      status: loc.status,
    })
    setDialogOpen(true)
  }

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
      setDialogOpen(false)
      await fetchList(page)
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
      toast.error(editing ? "编辑模式下测试请重新填写 SecretKey" : "请填写 SecretKey 后再测试")
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

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await deleteStorageLocation(deleteTarget.id)
      if (res.code === 0) {
        toast.success(res.message || "删除成功")
        setDeleteTarget(null)
        await fetchList(page)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败")
    } finally {
      setDeleteLoading(false)
    }
  }

  const hasFilters = keyword.trim().length > 0

  return (
    <>
      <DataTable
        className="p-6"
        toolbarLeft={
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            新增存储位置
          </Button>
        }
        toolbarRight={
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="按名称搜索"
                className="pl-8"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch()
                }}
              />
            </div>
            <Button variant="secondary" onClick={handleSearch}>
              搜索
            </Button>
            {hasFilters && (
              <Button variant="ghost" onClick={handleClear}>
                清除
              </Button>
            )}
          </div>
        }
        header={
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>厂商</TableHead>
              <TableHead>区域</TableHead>
              <TableHead>存储桶</TableHead>
              <TableHead>AccessKey</TableHead>
              <TableHead className="w-20">状态</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={list.map((loc) => (
          <TableRow key={loc.id}>
            <TableCell className="font-mono text-xs">{loc.id}</TableCell>
            <TableCell className="font-medium">{loc.name}</TableCell>
            <TableCell>
              {PROVIDERS.find((p) => p.value === loc.provider)?.label ?? loc.provider}
            </TableCell>
            <TableCell>{loc.region}</TableCell>
            <TableCell>{loc.bucket}</TableCell>
            <TableCell className="max-w-[160px] truncate">{loc.accessKey}</TableCell>
            <TableCell>
              <span className={STORAGE_LOCATION_STATUS_TEXT_CLASSES[loc.status] ?? ""}>
                {STORAGE_LOCATION_STATUS_LABEL[loc.status] ?? loc.status}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="outline" size="sm" onClick={() => openEdit(loc)}>
                  编辑
                </Button>
                <Button
                  variant="outline-destructive"
                  size="sm"
                  onClick={() => setDeleteTarget(loc)}
                >
                  删除
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={list.length === 0}
        colSpan={8}
        onRefresh={handleRefresh}
        refreshDisabled={loading}
        emptyIcon={<HardDriveIcon className="size-4" />}
        emptyText="暂无存储位置"
        pagination={{ page, pageSize: PAGE_SIZE, total, onPageChange: fetchList }}
      />

      {/* 新增 / 编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑存储位置" : "新增存储位置"}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] p-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>名称</Label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="如：阿里云 OSS-华东"
              />
            </div>

            <div className="space-y-1.5">
              <Label>厂商</Label>
              <Select
                value={form.provider}
                onValueChange={(v) => setField("provider", v ?? "generic")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择厂商" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="删除存储位置"
        description={
          <>
            确定要删除「{deleteTarget?.name}」吗？该操作不可恢复。已使用此位置上传的图片仍可访问，但无法再从此位置删除。
          </>
        }
        variant="destructive"
        confirmText="删除"
        loading={deleteLoading}
        onConfirm={handleDelete}
      />
    </>
  )
}
