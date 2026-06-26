import { useCallback, useEffect, useState } from "react"
import { PackageIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { getTagBoundProducts } from "@/services"

interface ProductBindingSheetProps {
  tagId: number
  tagName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ProductBindingSheet({
  tagId,
  tagName,
  open,
  onOpenChange,
}: ProductBindingSheetProps) {
  const [products, setProducts] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const fetchProducts = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getTagBoundProducts(tagId, { page: targetPage, pageSize })
      setProducts(res.data.items)
      setTotal(res.data.total)
      setPage(res.data.page)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取绑定商品列表失败")
    } finally {
      setLoading(false)
    }
  }, [tagId])

  useEffect(() => {
    if (open) {
      fetchProducts(1)
    }
  }, [open, fetchProducts])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            商品绑定 — {tagName}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>商品名称</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-48 text-center">
                        <Empty>
                          <EmptyMedia variant="icon">
                            <PackageIcon className="size-4" />
                          </EmptyMedia>
                          <EmptyTitle>暂无绑定商品</EmptyTitle>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-xs">{product.id}</TableCell>
                        <TableCell>{product.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {products.length > 0 && (
                <Pagination className="justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page > 1) fetchProducts(page - 1) }}
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
                              onClick={(e: React.MouseEvent) => { e.preventDefault(); fetchProducts(p) }}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )
                    })()}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page < Math.ceil(total / pageSize)) fetchProducts(page + 1) }}
                        text="下一页"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
