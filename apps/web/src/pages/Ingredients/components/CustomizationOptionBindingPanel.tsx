import { useCallback, useEffect, useState } from "react"
import { LinkIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import type { PaginatedData } from "@/api"
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
import {
  getIngredientBoundOptions,
  bindOptionToIngredient,
  updateIngredientOptionQuantity,
  unbindOptionFromIngredient,
} from "@/api"

interface BoundOption {
  optionId: number
  optionName: string
  customizationName: string
  quantity: number
}

interface CustomizationOptionBindingPanelProps {
  ingredientId: number
  unit: string
}

export default function CustomizationOptionBindingPanel({ ingredientId, unit }: CustomizationOptionBindingPanelProps) {
  const [options, setOptions] = useState<BoundOption[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const [bindOpen, setBindOpen] = useState(false)
  const [bindOptionId, setBindOptionId] = useState("")
  const [bindQuantity, setBindQuantity] = useState("0")
  const [binding, setBinding] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editOption, setEditOption] = useState<BoundOption | null>(null)
  const [editQuantity, setEditQuantity] = useState("0")
  const [editing, setEditing] = useState(false)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BoundOption | null>(null)

  const fetchOptions = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getIngredientBoundOptions(ingredientId, { page: targetPage, pageSize })
      if (res.code === 0) {
        const data = res.data as PaginatedData<BoundOption>
        setOptions(data.items)
        setTotal(data.total)
        setPage(targetPage)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取绑定的客制化选项列表失败")
    } finally {
      setLoading(false)
    }
  }, [ingredientId, pageSize])

  useEffect(() => {
    fetchOptions(1)
  }, [fetchOptions])

  const handleBind = async () => {
    const optionId = Number(bindOptionId)
    if (!optionId || optionId <= 0) {
      toast.error("请选择客制化选项")
      return
    }

    const quantity = Number(bindQuantity) || 0
    if (quantity < 0) {
      toast.error("用量不能为负数")
      return
    }

    setBinding(true)
    try {
      const res = await bindOptionToIngredient(ingredientId, optionId, quantity)
      if (res.code === 0) {
        toast.success(res.message)
        setBindOpen(false)
        setBindOptionId("")
        setBindQuantity("0")
        await fetchOptions(1)
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

  const handleUnbind = async (optionId: number) => {
    setBinding(true)
    try {
      const res = await unbindOptionFromIngredient(ingredientId, optionId)
      if (res.code === 0) {
        toast.success(res.message)
        await fetchOptions(page)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? (err instanceof Error ? err.message : "解绑失败"))
    } finally {
      setBinding(false)
    }
  }

  const openUnbindConfirm = (option: BoundOption) => {
    setDeleteTarget(option)
    setDeleteConfirmOpen(true)
  }

  const openEditDialog = (option: BoundOption) => {
    setEditOption(option)
    setEditQuantity(String(option.quantity))
    setEditOpen(true)
  }

  const handleEditQuantity = async () => {
    if (!editOption) return

    const quantity = Number(editQuantity) || 0
    if (quantity < 0) {
      toast.error("用量不能为负数")
      return
    }

    setEditing(true)
    try {
      const res = await updateIngredientOptionQuantity(ingredientId, editOption.optionId, quantity)
      if (res.code === 0) {
        toast.success(res.message)
        setEditOpen(false)
        setEditOption(null)
        await fetchOptions(page)
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
            <DialogTrigger render={<Button><LinkIcon data-icon="inline-start" />绑定客制化选项</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>绑定客制化选项</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">客制化选项ID</label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="请输入客制化选项ID"
                    value={bindOptionId}
                    onChange={(e) => setBindOptionId(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">用量</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="默认 0"
                      value={bindQuantity}
                      onChange={(e) => setBindQuantity(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground shrink-0">{unit}</span>
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
        {!loading && <span className="text-sm text-muted-foreground">共 {total} 个客制化选项</span>}
      </div>

      <ScrollArea className="max-h-[calc(100vh-480px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">选项ID</TableHead>
              <TableHead>选项名称</TableHead>
              <TableHead>所属客制化</TableHead>
              <TableHead className="w-24">用量（{unit}）</TableHead>
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
            ) : options.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <Empty>
                    <EmptyMedia variant="icon">
                      <LinkIcon className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>暂无数据</EmptyTitle>
                    <Button onClick={() => setBindOpen(true)}>
                      立即添加
                    </Button>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              options.map((o) => (
                <TableRow key={o.optionId}>
                  <TableCell className="font-mono text-xs">{o.optionId}</TableCell>
                  <TableCell>{o.optionName}</TableCell>
                  <TableCell>{o.customizationName}</TableCell>
                  <TableCell className="font-mono text-xs">{o.quantity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(o)}>
                        <PencilIcon data-icon="inline-start" />
                        编辑
                      </Button>
                      <Button
                        variant="outline-destructive"
                        size="sm"
                        onClick={() => openUnbindConfirm(o)}
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
      {!loading && options.length > 0 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  if (page > 1) fetchOptions(page - 1)
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
                        fetchOptions(p)
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
                  if (page < Math.ceil(total / pageSize)) fetchOptions(page + 1)
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
              修改该原料在客制化选项「{editOption?.optionName}」中的用量
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">用量</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="用量"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                />
                <span className="text-sm text-muted-foreground shrink-0">{unit}</span>
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
              确定要将原料与客制化选项「{deleteTarget?.optionName}」解除绑定吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleteTarget) await handleUnbind(deleteTarget.optionId)
                setDeleteConfirmOpen(false)
                setDeleteTarget(null)
              }}
              disabled={binding}
            >
              {binding ? "解绑中..." : "确认解绑"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
