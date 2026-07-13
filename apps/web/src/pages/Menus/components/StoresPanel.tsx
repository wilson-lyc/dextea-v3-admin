import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ChevronDownIcon,
  ClipboardListIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PlusIcon,
  UnlinkIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { Store } from "@/api"
import { STORE_STATUS_LABEL, STORE_STATUS_TEXT_CLASSES } from "@dextea-admin/contracts/status"
import { getStoresByMenuId, bindStoreMenu } from "@/api"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import DispatchByAreaDialog from "./DispatchByAreaDialog"
import DispatchByIdDialog from "./DispatchByIdDialog"

interface StoresPanelProps {
  menuId: number
  menuName: string
}

export default function StoresPanel({ menuId, menuName }: StoresPanelProps) {
  const navigate = useNavigate()

  // 列表数据与分页状态
  const [stores, setStores] = useState<Store[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20

  // UI 状态
  const [loading, setLoading] = useState(true)

  // 解绑确认弹窗状态
  const [unbindDialogOpen, setUnbindDialogOpen] = useState(false)
  const [unbinding, setUnbinding] = useState(false)
  const [unbindError, setUnbindError] = useState<string | null>(null)
  const [unbindTarget, setUnbindTarget] = useState<Store | null>(null)

  // 按地域分发弹窗状态
  const [dispatchAreaOpen, setDispatchAreaOpen] = useState(false)

  // 按ID分发弹窗状态
  const [dispatchByIdOpen, setDispatchByIdOpen] = useState(false)

  // 获取关联门店列表
  const fetchData = useCallback(
    async (targetPage: number) => {
      setLoading(true)
      try {
        const res = await getStoresByMenuId(menuId, { page: targetPage, pageSize })
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
    },
    [menuId],
  )

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  // 解绑确认
  const handleUnbindClick = (store: Store) => {
    setUnbindTarget(store)
    setUnbindError(null)
    setUnbindDialogOpen(true)
  }

  const handleUnbindConfirm = async () => {
    if (!unbindTarget) return
    setUnbinding(true)
    try {
      const res = await bindStoreMenu(unbindTarget.id, { menuId: null })
      if (res.code === 0) {
        toast.success("解绑成功")
        setUnbindDialogOpen(false)
        fetchData(page)
      } else {
        setUnbindError(res.message)
      }
    } catch (err) {
      console.error(err)
      setUnbindError("解绑失败，请重试")
    } finally {
      setUnbinding(false)
    }
  }

  return (
    <>
      <DataTable
        toolbarLeft={
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              <PlusIcon data-icon="inline-start" />
              分发菜单
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => setDispatchAreaOpen(true)}
              >
                <MapPinIcon />
                按地域分发
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDispatchByIdOpen(true)}
              >
                <ClipboardListIcon />
                按ID分发
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
        header={
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              <TableHead className="w-24">门店ID</TableHead>
              <TableHead className="w-48">门店名称</TableHead>
              <TableHead>省份</TableHead>
              <TableHead>城市</TableHead>
              <TableHead>区县</TableHead>
              <TableHead className="w-28">门店状态</TableHead>
              <TableHead className="w-48 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={stores.map((store) => (
          <TableRow key={store.id}>
            <TableCell className="font-mono text-xs">{store.id}</TableCell>
            <TableCell className="max-w-48 truncate">{store.name}</TableCell>
            <TableCell>{store.province}</TableCell>
            <TableCell>{store.city}</TableCell>
            <TableCell>{store.district}</TableCell>
            <TableCell>
              <span className={STORE_STATUS_TEXT_CLASSES[store.status]}>
                {STORE_STATUS_LABEL[store.status]}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/stores/${store.id}`)}
                >
                  <ExternalLinkIcon data-icon="inline-start" />
                  查看门店
                </Button>
                <Button
                  variant="outline-destructive"
                  size="sm"
                  onClick={() => handleUnbindClick(store)}
                >
                  <UnlinkIcon data-icon="inline-start" />
                  解绑
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={stores.length === 0}
        colSpan={7}
        onRefresh={() => fetchData(page)}
        refreshDisabled={loading}
        emptyIcon={<ClipboardListIcon className="size-4" />}
        emptyText="暂无关联门店"
        pagination={{ page, pageSize, total, onPageChange: fetchData }}
      />

      {/* 解绑确认弹窗 */}
      <ConfirmDialog
        open={unbindDialogOpen}
        onOpenChange={setUnbindDialogOpen}
        title="确认解绑"
        description={
          <>
            确定要解绑{" "}
            <span className="font-semibold text-foreground">
              {unbindTarget?.name}
            </span>{" "}
            与当前菜单的关联吗？解绑后该门店将无法使用此菜单。
          </>
        }
        confirmText="解绑"
        variant="destructive"
        loading={unbinding}
        errorMessage={unbindError}
        onConfirm={handleUnbindConfirm}
      />

      {/* 按地域分发弹窗 */}
      <DispatchByAreaDialog
        open={dispatchAreaOpen}
        onOpenChange={setDispatchAreaOpen}
        menuId={menuId}
        menuName={menuName}
        onDispatched={() => fetchData(1)}
      />

      {/* 按ID分发弹窗 */}
      <DispatchByIdDialog
        open={dispatchByIdOpen}
        onOpenChange={setDispatchByIdOpen}
        menuId={menuId}
        menuName={menuName}
        onDispatched={() => fetchData(1)}
      />
    </>
  )
}
