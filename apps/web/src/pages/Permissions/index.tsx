import { useCallback, useEffect, useState } from "react"
import { KeySquareIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import type { Permission } from "@/api"
import { getPermissions } from "@/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const fetchPermissions = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const params: { page?: number; pageSize?: number; keyword?: string } = {
        page: targetPage,
        pageSize,
      }
      if (searchKeyword) params.keyword = searchKeyword
      const res = await getPermissions(params)
      if (res.code === 0) {
        setPermissions(res.data.items)
        setTotal(res.data.total)
        setPage(targetPage)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "系统异常，稍后重试")
    } finally {
      setLoading(false)
    }
  }, [searchKeyword, pageSize])

  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await fetchPermissions(page)
    toast.success("刷新成功")
  }, [fetchPermissions, page])

  useEffect(() => {
    fetchPermissions(1)
  }, [fetchPermissions])

  const handleSearch = () => setSearchKeyword(keyword)

  return (
    <DataTable
      className="p-6"
      toolbarRight={
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索权限键、名称"
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
            <TableHead className="w-20">ID</TableHead>
            <TableHead className="w-48">权限键</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>备注</TableHead>
            <TableHead className="w-36">创建时间</TableHead>
          </TableRow>
        </TableHeader>
      }
      body={permissions.map((p) => (
        <TableRow key={p.id}>
          <TableCell className="font-mono text-xs">{p.id}</TableCell>
          <TableCell>
            <Badge variant="secondary" className="font-mono">
              {p.key}
            </Badge>
          </TableCell>
          <TableCell className="font-medium">{p.name}</TableCell>
          <TableCell className="text-muted-foreground">{p.note || "—"}</TableCell>
          <TableCell className="text-muted-foreground">{p.createdAt}</TableCell>
        </TableRow>
      ))}
      loading={loading}
      isEmpty={permissions.length === 0}
      colSpan={5}
      onRefresh={handleRefresh}
      refreshDisabled={loading}
      emptyIcon={<KeySquareIcon className="size-4" />}
      emptyText="暂无权限"
      pagination={{ page, pageSize, total, onPageChange: fetchPermissions }}
    />
  )
}
