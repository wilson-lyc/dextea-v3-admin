import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PlusIcon, RefreshCwIcon, RotateCwIcon, SearchIcon, SettingsIcon, Building2Icon } from "lucide-react"
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
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { getStores, syncStoreLocations } from "@/api"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Spinner } from "@/components/ui/spinner"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
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
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            创建门店
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => { setLoading(true); setTimeout(() => fetchStores(page), 1000) }}
          >
            <RotateCwIcon className="size-4" />
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

      <TooltipProvider>
        <div className="flex flex-1 flex-col overflow-auto rounded-lg border">
          <Table className={`base-class ${(stores.length === 0 || loading) && 'flex-1'}`}>
            <TableHeader>
              <TableRow className="sticky top-0 bg-background">
                <TableHead className="w-24">ID</TableHead>
                <TableHead className="w-24">门店名称</TableHead>
                <TableHead className="w-24">地址</TableHead>
                <TableHead className="w-24">联系电话</TableHead>
                <TableHead className="w-24">营业时间</TableHead>
                <TableHead className="w-24">状态</TableHead>
                <TableHead className="w-36 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            {loading ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="flex-1">
                    <div className="flex items-center justify-center">
                      <Spinner className="size-6 text-muted-foreground" />
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : stores.length === 0 ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="justify-center">
                    <div className="flex items-center justify-center">
                      <Empty>
                        <EmptyMedia variant="icon">
                          <Building2Icon className="size-4" />
                        </EmptyMedia>
                        <EmptyTitle>暂无数据</EmptyTitle>
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
                      <span className={STORE_STATUS_TEXT_CLASSES[store.status]}>
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
                ))}
              </TableBody>
            )}
          </Table>
        </div>
      </TooltipProvider >

      {
        stores.length > 0 && (() => {
          const totalPages = Math.ceil(total / pageSize)
          const pages: (number | "...")[] = []
          if (totalPages <= 6) {
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
          return (
            <Pagination className="shrink-0 justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    text="上一页"
                    onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page > 1) fetchStores(page - 1) }}
                  />
                </PaginationItem>
                {pages.map((p, idx) =>
                  p === "..." ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
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
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    text="下一页"
                    onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page < totalPages) fetchStores(page + 1) }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )
        })()
      }

      < CreateStoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => fetchStores(1)
        }
      />
    </div >
  )
}
