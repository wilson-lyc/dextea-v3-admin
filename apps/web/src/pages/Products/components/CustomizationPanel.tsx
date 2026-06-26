import { useCallback, useEffect, useState } from "react"
import { LinkIcon, PencilIcon, Trash2Icon, ListIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getBoundCustomizations, addProductCustomization, removeProductCustomization, updateProductCustomizationSort } from "@/services"

interface CustomizationPanelProps {
  productId: number
}

interface BoundCustomization {
  customizationId: number
  customizationName: string
  displayName: string
  sort: number
}

export default function CustomizationPanel({ productId }: CustomizationPanelProps) {
  const navigate = useNavigate()
  const [customizations, setCustomizations] = useState<BoundCustomization[]>([])
  const [loading, setLoading] = useState(true)

  const [bindOpen, setBindOpen] = useState(false)
  const [bindCustomizationId, setBindCustomizationId] = useState("")
  const [bindSort, setBindSort] = useState("0")
  const [binding, setBinding] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editCustomization, setEditCustomization] = useState<BoundCustomization | null>(null)
  const [editSort, setEditSort] = useState("0")
  const [editing, setEditing] = useState(false)

  const fetchCustomizations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getBoundCustomizations(productId)
      if (res.code === 0) {
        setCustomizations(res.data)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取绑定的客制化项目失败")
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchCustomizations()
  }, [fetchCustomizations])

  const handleBind = async () => {
    const customizationId = Number(bindCustomizationId)
    if (!customizationId || customizationId <= 0) {
      toast.error("请输入有效的客制化项目ID")
      return
    }

    setBinding(true)
    try {
      const res = await addProductCustomization(productId, customizationId, Number(bindSort) || 0)
      if (res.code === 0) {
        toast.success(res.message)
        setBindOpen(false)
        setBindCustomizationId("")
        setBindSort("0")
        await fetchCustomizations()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "绑定客制化项目失败")
    } finally {
      setBinding(false)
    }
  }

  const handleUnbind = async (customizationId: number) => {
    try {
      const res = await removeProductCustomization(productId, customizationId)
      if (res.code === 0) {
        toast.success(res.message)
        await fetchCustomizations()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "解绑客制化项目失败")
    }
  }

  const openEditDialog = (item: BoundCustomization) => {
    setEditCustomization(item)
    setEditSort(String(item.sort))
    setEditOpen(true)
  }

  const handleEditSort = async () => {
    if (!editCustomization) return

    setEditing(true)
    try {
      const res = await updateProductCustomizationSort(productId, editCustomization.customizationId, Number(editSort) || 0)
      if (res.code === 0) {
        toast.success(res.message)
        setEditOpen(false)
        setEditCustomization(null)
        await fetchCustomizations()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新排序失败")
    } finally {
      setEditing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Dialog open={bindOpen} onOpenChange={setBindOpen}>
          <DialogTrigger render={<Button><LinkIcon data-icon="inline-start" />绑定新项目</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>绑定新客制化项目</DialogTitle>
              <DialogDescription>输入客制化项目ID和排序序号即可绑定到该商品</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">客制化项目ID</label>
                <Input
                  placeholder="输入客制化项目ID"
                  value={bindCustomizationId}
                  onChange={(e) => setBindCustomizationId(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">排序序号</label>
                <Input
                  placeholder="默认 0"
                  value={bindSort}
                  onChange={(e) => setBindSort(e.target.value)}
                />
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

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          加载中...
        </div>
      ) : customizations.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <ListIcon className="size-4" />
          </EmptyMedia>
          <EmptyTitle>暂未绑定客制化项目</EmptyTitle>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">项目ID</TableHead>
              <TableHead className="w-2/5">名称</TableHead>
              <TableHead className="w-2/5">展示名称</TableHead>
              <TableHead className="w-20">排序</TableHead>
              <TableHead className="w-52 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customizations.map((c) => (
              <TableRow key={c.customizationId}>
                <TableCell className="font-mono text-xs">{c.customizationId}</TableCell>
                <TableCell>{c.customizationName}</TableCell>
                <TableCell>{c.displayName || "-"}</TableCell>
                <TableCell className="font-mono text-xs">{c.sort}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/products/customization/${c.customizationId}`)}
                    >
                      <LinkIcon data-icon="inline-start" />
                      查看项目
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(c)}
                    >
                      <PencilIcon data-icon="inline-start" />
                      编辑
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-500"
                      onClick={() => handleUnbind(c.customizationId)}
                    >
                      <Trash2Icon className="size-4" data-icon="inline-start" />
                      解绑
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑排序</DialogTitle>
            <DialogDescription>
              修改客制化项目「{editCustomization?.customizationName}」在当前商品中的排序序号
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">排序序号</label>
              <Input
                placeholder="排序序号"
                value={editSort}
                onChange={(e) => setEditSort(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button onClick={handleEditSort} disabled={editing}>
              {editing ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
