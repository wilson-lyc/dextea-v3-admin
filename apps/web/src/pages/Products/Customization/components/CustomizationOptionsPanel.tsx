import { useCallback, useEffect, useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import type { CustomizationOption } from "@dextea/shared-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  getCustomizationOptions,
  createCustomizationOption,
  updateCustomizationOption,
  deleteCustomizationOption,
} from "@/services"

interface CustomizationOptionsPanelProps {
  customizationId: number
}

type OptionForm = {
  name: string
  price: string
}

const emptyForm = (): OptionForm => ({ name: "", price: "0" })

export default function CustomizationOptionsPanel({ customizationId }: CustomizationOptionsPanelProps) {
  const [options, setOptions] = useState<CustomizationOption[]>([])
  const [loading, setLoading] = useState(true)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<OptionForm>(emptyForm())
  const [creating, setCreating] = useState(false)

  // Edit dialog
  const [editingOption, setEditingOption] = useState<CustomizationOption | null>(null)
  const [editForm, setEditForm] = useState<OptionForm>(emptyForm())
  const [saving, setSaving] = useState(false)

  const fetchOptions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCustomizationOptions(customizationId)
      if (res.code === 0) {
        setOptions(res.data)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取客制化选项列表失败")
    } finally {
      setLoading(false)
    }
  }, [customizationId])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error("请输入选项名称")
      return
    }

    setCreating(true)
    try {
      const res = await createCustomizationOption(customizationId, {
        name: createForm.name.trim(),
        price: Number(createForm.price) || 0,
      })
      if (res.code === 0) {
        toast.success(res.message)
        setCreateOpen(false)
        setCreateForm(emptyForm())
        await fetchOptions()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败")
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (option: CustomizationOption) => {
    setEditingOption(option)
    setEditForm({ name: option.name, price: String(option.price) })
  }

  const handleUpdate = async () => {
    if (!editingOption) return
    if (!editForm.name.trim()) {
      toast.error("请输入选项名称")
      return
    }

    setSaving(true)
    try {
      const res = await updateCustomizationOption(customizationId, editingOption.id, {
        name: editForm.name.trim(),
        price: Number(editForm.price) || 0,
      })
      if (res.code === 0) {
        toast.success(res.message)
        setEditingOption(null)
        await fetchOptions()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (optionId: number) => {
    try {
      const res = await deleteCustomizationOption(customizationId, optionId)
      if (res.code === 0) {
        toast.success(res.message)
        await fetchOptions()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          添加选项
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          加载中...
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead className="w-28">价格</TableHead>
              <TableHead className="w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {options.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  暂未添加客制化选项
                </TableCell>
              </TableRow>
            ) : (
              options.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell className="font-mono text-xs">¥{Number(o.price).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(o)}>
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-500"
                        onClick={() => handleDelete(o.id)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加客制化选项</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field>
              <FieldLabel htmlFor="option-name">
                名称 <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="option-name"
                placeholder="例如：少冰、七分糖"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate()
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="option-price">加价金额</FieldLabel>
              <Input
                id="option-price"
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={createForm.price}
                onChange={(e) => setCreateForm((f) => ({ ...f, price: e.target.value }))}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "创建中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingOption} onOpenChange={(open) => { if (!open) setEditingOption(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑客制化选项</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field>
              <FieldLabel htmlFor="edit-option-name">
                名称 <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="edit-option-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate()
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-option-price">加价金额</FieldLabel>
              <Input
                id="edit-option-price"
                type="number"
                min="0"
                step="0.5"
                value={editForm.price}
                onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOption(null)}>
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
