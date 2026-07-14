import { useCallback, useEffect, useState } from "react"
import { ListIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import type {
  CustomizationOption,
  RebindCustomizationOptionIngredientRequest,
} from "@/api"
import {
  CUSTOMIZATION_OPTION_STATUS,
  CUSTOMIZATION_OPTION_STATUS_LABEL,
  CUSTOMIZATION_OPTION_STATUS_TEXT_CLASSES,
} from "@dextea-admin/contracts/status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import DataTable from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { SelectPicker } from "@/components/ui/select-picker"
import { StatusSelectPicker } from "@/components/ui/status-select-picker"
import { Switch } from "@/components/ui/switch"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  getCustomizationOptions,
  createCustomizationOption,
  updateCustomizationOption,
  updateCustomizationOptionQuantity,
  rebindCustomizationOptionIngredient,
  deleteCustomizationOption,
  getIngredientOptions,
} from "@/api"

interface CustomizationOptionsPanelProps {
  customizationId: number
}

type CreateForm = {
  name: string
  price: string
  sort: string
  status: string
  bindIngredient: boolean
  ingredientId: string
  quantity: string
}

type EditForm = {
  name: string
  price: string
  sort: string
  status: string
}

const UNBIND_VALUE = "__unbind__"

const emptyCreateForm = (): CreateForm => ({
  name: "",
  price: "0",
  sort: "0",
  status: "0",
  bindIngredient: false,
  ingredientId: "",
  quantity: "0",
})

const emptyEditForm = (): EditForm => ({
  name: "",
  price: "0",
  sort: "0",
  status: "0",
})

export default function CustomizationOptionsPanel({ customizationId }: CustomizationOptionsPanelProps) {
  const [options, setOptions] = useState<CustomizationOption[]>([])
  const [loading, setLoading] = useState(true)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm())
  const [creating, setCreating] = useState(false)

  // Edit basic info dialog
  const [editingOption, setEditingOption] = useState<CustomizationOption | null>(null)
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm())
  const [saving, setSaving] = useState(false)

  // Edit quantity dialog
  const [quantityOption, setQuantityOption] = useState<CustomizationOption | null>(null)
  const [quantityValue, setQuantityValue] = useState("0")
  const [savingQuantity, setSavingQuantity] = useState(false)

  // Rebind ingredient dialog
  const [rebindOption, setRebindOption] = useState<CustomizationOption | null>(null)
  const [rebindIngredientId, setRebindIngredientId] = useState("")
  const [rebindQuantity, setRebindQuantity] = useState("0")
  const [savingRebind, setSavingRebind] = useState(false)

  const [ingredientOptions, setIngredientOptions] = useState<{ label: string; value: string; unit: string }[]>([])

  const createUnit = ingredientOptions.find((o) => o.value === createForm.ingredientId)?.unit ?? ""
  const rebindUnit = ingredientOptions.find((o) => o.value === rebindIngredientId)?.unit ?? ""
  const quantityUnit = quantityOption
    ? (ingredientOptions.find((o) => o.value === String(quantityOption.ingredientId))?.unit ?? "")
    : ""

  // 按原料 ID 取单位，用于列表用量列展示（如「20 毫升」）
  const unitOf = (ingredientId: number | null) =>
    ingredientId == null ? "" : (ingredientOptions.find((o) => o.value === String(ingredientId))?.unit ?? "")

  // 换绑可选清单：在原料列表末尾追加「解绑」项
  const rebindOptions = [
    { label: "不绑定原料", value: UNBIND_VALUE },
    ...ingredientOptions,
  ]

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

  useEffect(() => {
    getIngredientOptions().then((res) => {
      if (res.code === 0) setIngredientOptions(res.data)
    }).catch(() => {})
  }, [])

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
        sort: Number(createForm.sort) || 0,
        ingredientId: createForm.bindIngredient ? (Number(createForm.ingredientId) || null) : null,
        quantity: createForm.bindIngredient ? (Number(createForm.quantity) || 0) : 0,
      })
      if (res.code === 0) {
        toast.success(res.message)
        setCreateOpen(false)
        setCreateForm(emptyCreateForm())
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
    setEditForm({
      name: option.name,
      price: String(option.price),
      sort: String(option.sort),
      status: String(option.status),
    })
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
        sort: Number(editForm.sort) || 0,
        status: Number(editForm.status) as CustomizationOption["status"],
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

  const openQuantity = (option: CustomizationOption) => {
    setQuantityOption(option)
    setQuantityValue(String(option.quantity))
  }

  const handleUpdateQuantity = async () => {
    if (!quantityOption) return
    const quantity = Number(quantityValue)
    if (Number.isNaN(quantity) || quantity < 0) {
      toast.error("请输入有效的用量")
      return
    }

    setSavingQuantity(true)
    try {
      const res = await updateCustomizationOptionQuantity(customizationId, quantityOption.id, quantity)
      if (res.code === 0) {
        toast.success(res.message)
        setQuantityOption(null)
        await fetchOptions()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新用量失败")
    } finally {
      setSavingQuantity(false)
    }
  }

  const openRebind = (option: CustomizationOption) => {
    setRebindOption(option)
    setRebindIngredientId(option.ingredientId != null ? String(option.ingredientId) : "")
    setRebindQuantity(String(option.quantity))
  }

  const handleRebind = async () => {
    if (!rebindOption) return

    const isUnbind = rebindIngredientId === UNBIND_VALUE
    const ingredientId = isUnbind ? null : Number(rebindIngredientId)
    // 解绑时用量重置为 0；换绑到具体原料时必须填写新用量。
    const quantity = isUnbind ? 0 : Number(rebindQuantity)

    if (!isUnbind && (Number.isNaN(quantity) || quantity < 0)) {
      toast.error("换绑原料时请填写有效的用量")
      return
    }

    const payload: RebindCustomizationOptionIngredientRequest = { ingredientId, quantity }

    setSavingRebind(true)
    try {
      const res = await rebindCustomizationOptionIngredient(customizationId, rebindOption.id, payload)
      if (res.code === 0) {
        toast.success(res.message)
        setRebindOption(null)
        await fetchOptions()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "换绑失败")
    } finally {
      setSavingRebind(false)
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
      <DataTable
        toolbarLeft={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            新建选项
          </Button>
        }
        header={
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              <TableHead className="w-20">选项ID</TableHead>
              <TableHead>名称</TableHead>
              <TableHead className="w-28">价格</TableHead>
              <TableHead className="w-20">排序</TableHead>
              <TableHead className="w-20">全局状态</TableHead>
              <TableHead>绑定原料</TableHead>
              <TableHead className="w-20">用量</TableHead>
              <TableHead className="w-80 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={options.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="font-mono text-xs">{o.id}</TableCell>
            <TableCell>{o.name}</TableCell>
            <TableCell className="font-mono text-xs">¥ {Number(o.price).toFixed(2)}</TableCell>
            <TableCell className="font-mono text-xs">{o.sort}</TableCell>
            <TableCell>
              <span className={CUSTOMIZATION_OPTION_STATUS_TEXT_CLASSES[o.status] ?? ""}>
                {CUSTOMIZATION_OPTION_STATUS_LABEL[o.status]}
              </span>
            </TableCell>
            <TableCell className="text-sm">
              {o.ingredientId != null ? (
                <span>{o.ingredientName || `原料 #${o.ingredientId}`}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {o.ingredientId != null
                ? (() => {
                    const u = unitOf(o.ingredientId)
                    return u ? `${o.quantity} ${u}` : String(o.quantity)
                  })()
                : "—"}
            </TableCell>
            <TableCell className="text-right">
              <div className="grid grid-cols-2 justify-items-end gap-1">
                <Button variant="outline" size="sm" onClick={() => openEdit(o)}>
                  编辑选项
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={o.ingredientId == null}
                  onClick={() => openQuantity(o)}
                  title={o.ingredientId == null ? "未绑定原料，无可编辑用量" : "修改绑定用量"}
                >
                  修改用量
                </Button>
                <Button variant="outline" size="sm" onClick={() => openRebind(o)}>
                  换绑原料
                </Button>
                <Button
                  variant="outline-destructive"
                  size="sm"
                  onClick={() => handleDelete(o.id)}
                >
                  删除选项
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={options.length === 0}
        colSpan={8}
        hideRefresh
        emptyIcon={<ListIcon className="size-4" />}
        emptyText="暂无数据"
      />

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加客制化选项</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field>
            <FieldLabel htmlFor="option-name">
              名称
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
            <Field>
              <FieldLabel htmlFor="option-sort">排序序号</FieldLabel>
              <Input
                id="option-sort"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={createForm.sort}
                onChange={(e) => setCreateForm((f) => ({ ...f, sort: e.target.value }))}
              />
            </Field>

            <Field>
              <div className="flex items-center gap-3">
                <Switch
                  checked={createForm.bindIngredient}
                  onCheckedChange={(checked) =>
                    setCreateForm((f) => ({ ...f, bindIngredient: checked }))
                  }
                  id="option-bind-ingredient"
                />
                <FieldLabel htmlFor="option-bind-ingredient" className="mb-0">
                  绑定原料
                </FieldLabel>
              </div>
            </Field>

            {createForm.bindIngredient && (
              <>
                <Field>
                  <FieldLabel htmlFor="option-ingredient">原料</FieldLabel>
                  <SelectPicker
                    options={ingredientOptions}
                    value={createForm.ingredientId}
                    onValueChange={(v) => setCreateForm((f) => ({ ...f, ingredientId: v }))}
                    placeholder="请选择原料"
                    className="w-full"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="option-quantity">用量</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="option-quantity"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="0"
                      value={createForm.quantity}
                      onChange={(e) => setCreateForm((f) => ({ ...f, quantity: e.target.value }))}
                    />
                    <span className="text-sm text-muted-foreground shrink-0">{createUnit}</span>
                  </div>
                </Field>
              </>
            )}
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

      {/* Edit Basic Info Dialog */}
      <Dialog open={!!editingOption} onOpenChange={(open) => { if (!open) setEditingOption(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑客制化选项</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field>
            <FieldLabel htmlFor="edit-option-name">
              名称
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
            <Field>
              <FieldLabel htmlFor="edit-option-sort">排序序号</FieldLabel>
              <Input
                id="edit-option-sort"
                type="number"
                min="0"
                step="1"
                value={editForm.sort}
                onChange={(e) => setEditForm((f) => ({ ...f, sort: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-option-status">状态</FieldLabel>
              <StatusSelectPicker
              statusEnum={CUSTOMIZATION_OPTION_STATUS}
              labels={CUSTOMIZATION_OPTION_STATUS_LABEL}
              value={editForm.status}
              onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}
              placeholder="请选择状态"
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

      {/* Edit Quantity Dialog */}
      <Dialog open={!!quantityOption} onOpenChange={(open) => { if (!open) setQuantityOption(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改绑定用量</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field>
              <FieldLabel htmlFor="edit-quantity">用量</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateQuantity()
                  }}
                />
                <span className="text-sm text-muted-foreground shrink-0">{quantityUnit}</span>
              </div>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuantityOption(null)}>
              取消
            </Button>
            <Button onClick={handleUpdateQuantity} disabled={savingQuantity}>
              {savingQuantity ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rebind Ingredient Dialog */}
      <Dialog open={!!rebindOption} onOpenChange={(open) => { if (!open) setRebindOption(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>换绑原料</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field>
              <FieldLabel htmlFor="rebind-ingredient">原料</FieldLabel>
              <SelectPicker
                options={rebindOptions}
                value={rebindIngredientId}
                onValueChange={(v) => setRebindIngredientId(v)}
                placeholder="请选择原料或解绑"
                className="w-full"
              />
            </Field>

            {rebindIngredientId !== UNBIND_VALUE && (
              <Field>
                <FieldLabel htmlFor="rebind-quantity">新用量</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="rebind-quantity"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={rebindQuantity}
                    onChange={(e) => setRebindQuantity(e.target.value)}
                  />
                  <span className="text-sm text-muted-foreground shrink-0">{rebindUnit}</span>
                </div>
              </Field>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRebindOption(null)}>
              取消
            </Button>
            <Button onClick={handleRebind} disabled={savingRebind}>
              {savingRebind ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
