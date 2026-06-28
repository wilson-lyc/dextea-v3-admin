import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PlusIcon, RefreshCwIcon, SearchIcon, SettingsIcon, Building2Icon } from "lucide-react"
import { toast } from "sonner"

import type { Store, StoreStatus } from "@dextea/shared-types"
import { STORE_STATUS } from "@dextea/shared-types"

const STORE_STATUS_LABEL: Record<number, string> = {
  [STORE_STATUS.RESTING.value]: "休息中",
  [STORE_STATUS.OPEN.value]: "营业中",
  [STORE_STATUS.PREPARING.value]: "筹备中",
  [STORE_STATUS.CLOSED.value]: "已注销",
}
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { getStores, syncStoreLocations } from "@/services"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { CreateStoreDialog } from "./components/CreateStoreDialog"

const STATUS_CLASSES: Record<StoreStatus, string> = {
  0: "text-red-600 dark:text-red-400",
  1: "text-green-600 dark:text-green-400",
  2: "text-blue-600 dark:text-blue-400",
  3: "text-muted-foreground",
}

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

  const fetchStores = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const params: { page?: number; pageSize?: number; keyword?: string } = { page: targetPage, pageSize }
      if (searchKeyword) {
        params.keyword = searchKeyword
      }
      const res = await getStores(params)
      setStores(res.data.items)
      setTotal(res.data.total)
      setPage(targetPage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取门店列表失败")
    } finally {
      setLoading(false)
    }
  }, [searchKeyword, pageSize])

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

  const fullAddress = (store: Store) => {
    return [store.province, store.city, store.district, store.address]
      .filter(Boolean)
      .join(" ")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            创建门店
          </Button>
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCwIcon data-icon="inline-start" className={syncing ? "animate-spin" : ""} />
            数据同步
          </Button>
        </div>
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
      </div>

      <ScrollArea className="max-h-[calc(100vh-480px)]">
        <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>门店名称</TableHead>
              <TableHead>地址</TableHead>
              <TableHead>联系电话</TableHead>
              <TableHead>营业时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
            ) : stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <Empty>
                    <EmptyMedia variant="icon">
                      <Building2Icon className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>暂无数据</EmptyTitle>
                    <Button onClick={() => setDialogOpen(true)}>
                      立即添加
                    </Button>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-mono text-xs">{store.id}</TableCell>
                  <TableCell>{store.name}</TableCell>
                  <TableCell className="max-w-60 truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{fullAddress(store)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{fullAddress(store)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{store.phone || "-"}</TableCell>
                  <TableCell>{store.businessHours || "-"}</TableCell>
                  <TableCell>
                    <span className={STATUS_CLASSES[store.status]}>
                      {STORE_STATUS_LABEL[store.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/stores/${store.id}`)}>
                      <SettingsIcon data-icon="inline-start" />
                      管理
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </TooltipProvider>
      </ScrollArea>

      {!loading && stores.length > 0 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page > 1) fetchStores(page - 1) }}
                text="上一页"
              />
            </PaginationItem>
            {(() => {
              const totalPages = Math.ceil(total / pageSize)
              const pages: (number | "...")[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (page > 3) pages.push("...")
                for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                  pages.push(i)
                }
                if (page < totalPages - 2) pages.push("...")
                pages.push(totalPages)
              }
              return pages.map((p, idx) =>
                p === "..." ? (
                  <PaginationItem key={`e-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e: React.MouseEvent) => { e.preventDefault(); fetchStores(p) }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )
            })()}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page < Math.ceil(total / pageSize)) fetchStores(page + 1) }}
                text="下一页"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <CreateStoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => fetchStores(1)}
      />
    </div>
  )
}
