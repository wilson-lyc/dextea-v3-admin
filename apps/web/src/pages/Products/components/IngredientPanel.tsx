import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LinkIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import type { PaginatedData } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Empty, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { SelectPicker } from "@/components/ui/select-picker"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { getProductBoundIngredients, bindIngredientToProduct, updateProductIngredientQuantity, unbindIngredientFromProduct, getIngredientOptions } from "@/services"

interface BoundIngredient {
  ingredientId: number
  ingredientName: string
  unit: string
  quantity: number
}

interface IngredientPanelProps {
  productId: number
}

export default function IngredientPanel({ productId }: IngredientPanelProps) {
  const navigate = useNavigate()
  const [ingredients, setIngredients] = useState<BoundIngredient[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const [bindOpen, setBindOpen] = useState(false)
  const [bindIngredientId, setBindIngredientId] = useState("")
  const [bindQuantity, setBindQuantity] = useState("0")
  const [bindUnit, setBindUnit] = useState("")
  const [binding, setBinding] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editIngredient, setEditIngredient] = useState<BoundIngredient | null>(null)
  const [editQuantity, setEditQuantity] = useState("0")
  const [editing, setEditing] = useState(false)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BoundIngredient | null>(null)
  const [unbinding, setUnbinding] = useState(false)

  const [ingredientOptions, setIngredientOptions] = useState<{ label: string; value: string; unit: string }[]>([])

  const fetchIngredients = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getProductBoundIngredients(productId, { page: targetPage, pageSize })
      if (res.code === 0) {
        const data = res.data as PaginatedData<BoundIngredient>
        setIngredients(data.items)
        setTotal(data.total)
        setPage(targetPage)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取绑定的原料列表失败")
    } finally {
      setLoading(false)
    }
  }, [productId, pageSize])

  useEffect(() => {
    fetchIngredients(1)
  }, [fetchIngredients])

  useEffect(() => {
    getIngredientOptions().then((res) => {
      if (res.code === 0) setIngredientOptions(res.data)
    }).catch(() => {})
  }, [])

  const handleBind = async () => {
    const ingredientId = Number(bindIngredientId)
    if (!ingredientId || ingredientId <= 0) {
      toast.error("请选择原料")
      return
    }

    setBinding(true)
    try {
      const res = await bindIngredientToProduct(productId, ingredientId, Number(bindQuantity) || 0)
      if (res.code === 0) {
        toast.success(res.message)
        setBindOpen(false)
        setBindIngredientId("")
        setBindQuantity("0")
        setBindUnit("")
        await fetchIngredients(1)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? (err instanceof Error ? err.message : "绑定失败"))
    } finally {
      setBinding(false)
    }
  }

  const handleUnbind = async (ingredientId: number) => {
    setUnbinding(true)
    try {
      const res = await unbindIngredientFromProduct(productId, ingredientId)
      if (res.code === 0) {
        toast.success(res.message)
        await fetchIngredients(page)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? (err instanceof Error ? err.message : "解绑失败"))
    } finally {
      setUnbinding(false)
    }
  }

  const openUnbindConfirm = (item: BoundIngredient) => {
    setDeleteTarget(item)
    setDeleteConfirmOpen(true)
  }

  const openEditDialog = (item: BoundIngredient) => {
    setEditIngredient(item)
    setEditQuantity(String(item.quantity))
    setEditOpen(true)
  }

  const handleEditQuantity = async () => {
    if (!editIngredient) return

    setEditing(true)
    try {
      const res = await updateProductIngredientQuantity(productId, editIngredient.ingredientId, Number(editQuantity) || 0)
      if (res.code === 0) {
        toast.success(res.message)
        setEditOpen(false)
        setEditIngredient(null)
        await fetchIngredients(page)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? (err instanceof Error ? err.message : "更新用量失败"))
    } finally {
      setEditing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <Dialog open={bindOpen} onOpenChange={setBindOpen}>
            <DialogTrigger render={<Button><LinkIcon data-icon="inline-start" />绑定原料</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>绑定新原料</DialogTitle>
                <DialogDescription>选择原料并设置用量即可将原料绑定到该商品</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">原料 <span className="text-red-500">*</span></label>
                  <SelectPicker
                    options={ingredientOptions}
                    value={bindIngredientId}
                    onValueChange={(value) => {
                      setBindIngredientId(value)
                      const option = ingredientOptions.find((o) => o.value === value)
                      setBindUnit(option?.unit ?? "")
                    }}
                    placeholder="请选择原料"
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">用量 <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="默认 0"
                      value={bindQuantity}
                      onChange={(e) => setBindQuantity(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground shrink-0">{bindUnit}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">取消</Button>} />
                <Button onClick={handleBind} disabled={binding}>
                  {binding ? "绑定中..." : "确定"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {!loading && <span className="text-sm text-muted-foreground">共 {total} 个原料</span>}
      </div>

      <ScrollArea className="max-h-[calc(100vh-480px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">原料ID</TableHead>
              <TableHead>原料名称</TableHead>
              <TableHead className="w-24">单位</TableHead>
              <TableHead className="w-28">用量</TableHead>
              <TableHead className="w-56 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
            ) : ingredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <Empty>
                    <EmptyMedia variant="icon">
                      <LinkIcon className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>暂未绑定原料</EmptyTitle>
                    <Button onClick={() => setBindOpen(true)}>
                      立即添加
                    </Button>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              ingredients.map((item) => (
                <TableRow key={item.ingredientId}>
                  <TableCell className="font-mono text-xs">{item.ingredientId}</TableCell>
                  <TableCell>{item.ingredientName}</TableCell>
                  <TableCell className="font-mono text-xs">{item.unit}</TableCell>
                  <TableCell className="font-mono text-xs">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/products/ingredients/${item.ingredientId}`)}>
                        <LinkIcon data-icon="inline-start" />
                        查看原料
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                        <PencilIcon data-icon="inline-start" />
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-500"
                        onClick={() => openUnbindConfirm(item)}
                      >
                        <Trash2Icon className="size-4" data-icon="inline-start" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Pagination */}
      {!loading && ingredients.length > 0 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  if (page > 1) fetchIngredients(page - 1)
                }}
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
                for (
                  let i = Math.max(2, page - 1);
                  i <= Math.min(totalPages - 1, page + 1);
                  i++
                ) {
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
                      onClick={(e: React.MouseEvent) => {
                        e.preventDefault()
                        fetchIngredients(p)
                      }}
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
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  if (page < Math.ceil(total / pageSize)) fetchIngredients(page + 1)
                }}
                text="下一页"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用量</DialogTitle>
            <DialogDescription>
              修改原料「{editIngredient?.ingredientName}」在当前商品中的用量
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">用量 <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="用量"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                />
                <span className="text-sm text-muted-foreground shrink-0">{editIngredient?.unit}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button onClick={handleEditQuantity} disabled={editing}>
              {editing ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认解绑</DialogTitle>
            <DialogDescription>
              确定要将原料「{deleteTarget?.ingredientName}」与当前商品解除绑定吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleteTarget) await handleUnbind(deleteTarget.ingredientId)
                setDeleteConfirmOpen(false)
                setDeleteTarget(null)
              }}
              disabled={unbinding}
            >
              {unbinding ? "解绑中..." : "确认解绑"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
