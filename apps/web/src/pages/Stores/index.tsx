import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PlusIcon, RefreshCwIcon, SearchIcon, SettingsIcon, Building2Icon, KeyRoundIcon } from "lucide-react"
import { toast } from "sonner"

import type { Store } from "@/api"
import { STORE_STATUS_LABEL, STORE_STATUS_TEXT_CLASSES } from "@dextea-admin/contracts/status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import DataTable from "@/components/ui/data-table"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import { getStores, syncStoreLocations, resetStorePassword } from "@/api"
import { CreateStoreDialog } from "./components/CreateStoreDialog"

export default function StoresPage() {
  const navigate = useNavigate()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const [dialogOpen, setDialogOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // 新密码弹窗状态
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")

  // 重置密码二次确认弹窗
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [resetStore, setResetStore] = useState<Store | null>(null)
  const [resetting, setResetting] = useState(false)

  const fetchStores = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const params: { page?: number; pageSize?: number; keyword?: string } = { page: targetPage, pageSize }
      if (searchKeyword) {
        params.keyword = searchKeyword
      }
      const res = await getStores(params)
      if (res.code === 0) {
        setStores(res.data.items)
        setTotal(res.data.total)
        setPage(targetPage)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      console.error(err)
      toast.error("数据加载异常")
    } finally {
      setLoading(false)
    }
  }, [searchKeyword, pageSize])

  // 刷新（强制等待 1 秒）
  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await fetchStores(page)
    toast.success("刷新成功")
  }, [fetchStores, page])

  useEffect(() => {
    fetchStores(1)
  }, [fetchStores])

  const handleSearch = () => {
    setSearchKeyword(keyword)
  }

  const handleSync = async () => {
    setSyncing(true)
    const startTime = Date.now()
    let message = ""
    let isError = false
    try {
      const res = await syncStoreLocations()
      message = res.message
    } catch (err) {
      message = err instanceof Error ? err.message : "同步门店定位数据失败"
      isError = true
    } finally {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 5000 - elapsed)
      setTimeout(() => {
        setSyncing(false)
        if (isError) {
          toast.error(message)
        } else {
          toast.success(message)
        }
      }, remaining)
    }
  }

  // 打开重置密码二次确认弹窗
  const handleResetPassword = (store: Store) => {
    setResetStore(store)
    setResetConfirmOpen(true)
  }

  // 二次确认后真正重置门店密码
  const handleConfirmReset = async () => {
    if (!resetStore) return
    const store = resetStore
    setResetting(true)
    try {
      const res = await resetStorePassword(store.id)
      if (res.code === 0) {
        setResetConfirmOpen(false)
        setResetStore(null)
        setNewPassword(res.data.newPassword)
        setPasswordDialogOpen(true)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "系统异常，稍后重试")
    } finally {
      setResetting(false)
    }
  }

  const fullAddress = (store: Store) => {
    return [store.province, store.city, store.district, store.address]
      .filter(Boolean)
      .join(" ")
  }

  return (
    <TooltipProvider>
      <DataTable
        className="p-6"
        toolbarLeft={
          <>
            <Button onClick={() => setDialogOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              创建门店
            </Button>
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              <RefreshCwIcon data-icon="inline-start" className={syncing ? "animate-spin" : ""} />
              数据同步
            </Button>
          </>
        }
        toolbarRight={
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索门店名称、电话、地址"
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
            {searchKeyword && (
              <Button
                variant="ghost"
                onClick={() => {
                  setKeyword("")
                  setSearchKeyword("")
                }}
              >
                清除
              </Button>
            )}
          </div>
        }
        header={
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              <TableHead className="w-24">ID</TableHead>
              <TableHead className="w-24">门店名称</TableHead>
              <TableHead className="w-24">地址</TableHead>
              <TableHead className="w-24">联系电话</TableHead>
              <TableHead className="w-24">营业时间</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-44 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={stores.map((store) => (
          <TableRow key={store.id}>
            <TableCell className="font-mono text-xs">{store.id}</TableCell>
            <TableCell>{store.name}</TableCell>
            <TableCell className="max-w-60 truncate">
              <Tooltip>
                <TooltipTrigger render={<span>{fullAddress(store)}</span>} />
                <TooltipContent>
                  <p>{fullAddress(store)}</p>
                </TooltipContent>
              </Tooltip>
            </TableCell>
            <TableCell>{store.phone || "-"}</TableCell>
            <TableCell>{store.businessHours || "-"}</TableCell>
            <TableCell>
              <span className={STORE_STATUS_TEXT_CLASSES[store.status]}>
                {STORE_STATUS_LABEL[store.status]}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="outline" size="sm" onClick={() => navigate(`/stores/${store.id}`)}>
                  <SettingsIcon data-icon="inline-start" />
                  管理
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleResetPassword(store)}>
                  <KeyRoundIcon data-icon="inline-start" />
                  重置密码
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={stores.length === 0}
        colSpan={7}
        onRefresh={handleRefresh}
        refreshDisabled={loading}
        emptyIcon={<Building2Icon className="size-4" />}
        emptyText="暂无数据"
        pagination={{ page, pageSize, total, onPageChange: fetchStores }}
      />

      <CreateStoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => fetchStores(1)}
      />

      {/* 重置后的新密码弹窗 */}
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

      {/* 重置密码二次确认弹窗 */}
      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="重置密码"
        description={`确定重置门店「${resetStore?.name}」的登录密码吗？重置后将生成新的登录密码。`}
        variant="default"
        loading={resetting}
        onConfirm={handleConfirmReset}
      />
    </TooltipProvider>
  )
}
