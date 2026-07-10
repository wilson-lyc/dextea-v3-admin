import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ChevronDownIcon,
  ClipboardListIcon,
  ExternalLinkIcon,
  MapPinIcon,
  PlusIcon,
  RotateCwIcon,
  UnlinkIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { Store } from "@/api"
import { STORE_STATUS_LABEL, STORE_STATUS_TEXT_CLASSES } from "@/lib/status"
import { getStoresByMenuId } from "@/api"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import PaginationBar from "@/components/ui/pagination-bar"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import DispatchByAreaDialog from "./DispatchByAreaDialog"
import DispatchByIdDialog from "./DispatchByIdDialog"

interface StoresPanelProps {
  menuId: string
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
        const res = await getStoresByMenuId(Number(menuId), { page: targetPage, pageSize })
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
      // TODO: 调用解绑门店菜单的 API
      void unbindTarget
      // const res = await unbindStoreMenu(unbindTarget.id)
      // if (res.code === 0) {
      //   toast.success("解绑成功")
      //   setUnbindDialogOpen(false)
      //   fetchData(page)
      // } else {
      //   setUnbindError(res.message)
      // }
      toast.success("解绑成功（TODO）")
      setUnbindDialogOpen(false)
    } catch (err) {
      console.error(err)
      setUnbindError("解绑失败，请重试")
    } finally {
      setUnbinding(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 flex-1">
      {/* 顶部操作栏 */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 分发菜单下拉按钮 */}
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

          {/* 刷新按钮 */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchData(page)}
          >
            <RotateCwIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* 表格 */}
      <div className="flex flex-1 flex-col overflow-auto rounded-lg border">
        <Table className={`${(stores.length === 0 || loading) ? "flex-1" : ""}`}>
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
          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="h-96">
                  <div className="flex items-center justify-center">
                    <Spinner className="size-6 text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : stores.length === 0 ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={7} className="h-96">
                  <div className="flex items-center justify-center">
                    <Empty>
                      <EmptyMedia variant="icon">
                        <ClipboardListIcon className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>暂无关联门店</EmptyTitle>
                    </Empty>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {stores.map((store) => (
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
            </TableBody>
          )}
        </Table>
      </div>

      {/* 分页 */}
      {stores.length > 0 && (
        <PaginationBar
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={fetchData}
          className="shrink-0 justify-end"
        />
      )}

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
        menuId={Number(menuId)}
        menuName={menuName}
        onDispatched={() => fetchData(1)}
      />

      {/* 按ID分发弹窗 */}
      <DispatchByIdDialog
        open={dispatchByIdOpen}
        onOpenChange={setDispatchByIdOpen}
        menuId={Number(menuId)}
        menuName={menuName}
        onDispatched={() => fetchData(1)}
      />
    </div>
  )
}
