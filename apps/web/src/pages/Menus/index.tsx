import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { PlusIcon, Settings, ClipboardListIcon, RotateCwIcon } from "lucide-react"
import { toast } from "sonner"

import type { Menu } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { getMenus } from "@/services"
import CreateMenuDialog from "./components/CreateMenuDialog"

export default function MenusPage() {
  const navigate = useNavigate()

  const [items, setItems] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchMenus = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const params = { page: targetPage, pageSize }
      const res = await getMenus(params)
      if (res.code === 0) {
        setItems(res.data.items)
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
  }, [pageSize])

  useEffect(() => {
    fetchMenus(1)
  }, [fetchMenus])

  return (
    <div className="flex h-full flex-col gap-4 p-6">

      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            新建菜单
          </Button>
          <Button variant="outline" size="icon" onClick={() => fetchMenus(page)}>
            <RotateCwIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col overflow-auto rounded-lg border max-h-[600px]">
        <Table>
          <TableHeader>
            <TableRow className="sticky top-0 bg-background">
              <TableHead className="w-16">菜单ID</TableHead>
              <TableHead className="w-44">菜单名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="w-44">创建时间</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <Spinner className="size-6 text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <Empty>
                  <EmptyMedia variant="icon">
                    <ClipboardListIcon className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>暂无数据</EmptyTitle>
                </Empty>
              </div>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell>{item.name || "—"}</TableCell>
                  <TableCell>{item.description || "—"}</TableCell>
                  <TableCell>{item.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/menus/${item.id}`)}>
                      <Settings data-icon="inline-start" />
                      管理
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {items.length > 0 && (() => {
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
                  onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page > 1) fetchMenus(page - 1) }}
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
                      onClick={(e: React.MouseEvent) => { e.preventDefault(); fetchMenus(p) }}
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
                  onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page < totalPages) fetchMenus(page + 1) }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )
      })()}

      <CreateMenuDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => fetchMenus(page)}
      />

    </div>
  )
}
