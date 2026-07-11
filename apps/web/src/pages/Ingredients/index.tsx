import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  FlaskConicalIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { Ingredient } from "@/api"
import { INGREDIENT_STATUS_LABEL, INGREDIENT_STATUS_TEXT_CLASSES } from "@dextea-admin/contracts/status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { getIngredients } from "@/api"
import DataTable from "@/components/ui/data-table"
import { CreateIngredientDialog } from "./components/CreateIngredientDialog"

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchIngredients = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const params: { page?: number; pageSize?: number; keyword?: string } = {
        page: targetPage,
        pageSize,
      }
      if (searchKeyword) {
        params.keyword = searchKeyword
      }
      const res = await getIngredients(params)
      setIngredients(res.data.items)
      setTotal(res.data.total)
      setPage(targetPage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取原料列表失败")
    } finally {
      setLoading(false)
    }
  }, [searchKeyword, pageSize])

  // 刷新（强制等待 1 秒）
  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await fetchIngredients(page)
    toast.success("刷新成功")
  }, [fetchIngredients, page])

  useEffect(() => {
    fetchIngredients(1)
  }, [fetchIngredients])

  const handleSearch = () => {
    setSearchKeyword(keyword)
  }

  const handleCreate = () => {
    setDialogOpen(true)
  }

  return (
    <>
      <DataTable
        className="p-6"
        toolbarLeft={
          <Button onClick={handleCreate}>
            <PlusIcon data-icon="inline-start" />
            新增原料
          </Button>
        }
        toolbarRight={
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索原料名称"
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
              <TableHead>ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>商品绑定</TableHead>
              <TableHead>客制化选项绑定</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={ingredients.map((ingredient) => (
          <TableRow key={ingredient.id}>
            <TableCell className="font-mono text-xs">{ingredient.id}</TableCell>
            <TableCell>{ingredient.name}</TableCell>
            <TableCell>{ingredient.unit}</TableCell>
            <TableCell>{ingredient.boundCount}</TableCell>
            <TableCell>{ingredient.optionCount}</TableCell>
            <TableCell>
              <span className={INGREDIENT_STATUS_TEXT_CLASSES[ingredient.status] ?? ""}>
                {INGREDIENT_STATUS_LABEL[ingredient.status] ?? "—"}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" onClick={() => navigate(`/products/ingredients/${ingredient.id}`)}>
                <SettingsIcon data-icon="inline-start" />
                管理
              </Button>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={ingredients.length === 0}
        colSpan={7}
        onRefresh={handleRefresh}
        refreshDisabled={loading}
        emptyIcon={<FlaskConicalIcon className="size-4" />}
        emptyText="暂无数据"
        pagination={{ page, pageSize, total, onPageChange: fetchIngredients }}
      />

      <CreateIngredientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => fetchIngredients(page)}
      />
    </>
  )
}
