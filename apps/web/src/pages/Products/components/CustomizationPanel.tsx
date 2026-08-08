import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDownIcon, DownloadIcon, ListIcon, PlusIcon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type { Customization } from "@/api"
import { CUSTOMIZATION_STATUS } from "@dextea-admin/contracts/status"
import { CUSTOMIZATION_STATUS_LABEL, CUSTOMIZATION_STATUS_TEXT_CLASSES } from "@dextea-admin/contracts/status"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  DialogClose,
} from "@/components/ui/dialog"
import ConfirmDialog from "@/components/ui/confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  getCustomizations,
  createCustomization,
  updateCustomizationStatus,
  batchUpdateCustomizationStatus,
  exportCustomization,
  importCustomization,
} from "@/api"
import type { ImportCustomizationRequest } from "@dextea-admin/contracts/dto"
import { logger, extractBackendMessage } from "@/lib/logger"
import { EditCustomizationDialog } from "./EditCustomizationDialog"
import ManageOptionsSheet from "./ManageOptionsSheet"

interface CustomizationPanelProps {
  productId: number
}

const pageSize = 20

export default function CustomizationPanel({ productId }: CustomizationPanelProps) {
  const [data, setData] = useState<Customization[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Manage options sheet
  const [manageSheetOpen, setManageSheetOpen] = useState(false)
  const [managingItem, setManagingItem] = useState<Customization | null>(null)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Customization | null>(null)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createSort, setCreateSort] = useState("")
  const [creating, setCreating] = useState(false)

  // Batch status
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false)
  const [batchConfirmAction, setBatchConfirmAction] = useState<0 | 1>(0)
  const [batchUpdating, setBatchUpdating] = useState(false)
  const [batchMenuOpen, setBatchMenuOpen] = useState(false)

  // Export / Import
  const [exporting, setExporting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [importing, setImporting] = useState(false)
  const batchMenuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openBatchMenu = useCallback(() => {
    if (batchMenuCloseTimer.current) clearTimeout(batchMenuCloseTimer.current)
    setBatchMenuOpen(true)
  }, [])
  const scheduleCloseBatchMenu = useCallback(() => {
    if (batchMenuCloseTimer.current) clearTimeout(batchMenuCloseTimer.current)
    batchMenuCloseTimer.current = setTimeout(() => {
      setBatchMenuOpen(false)
      batchMenuCloseTimer.current = null
    }, 120)
  }, [])

  const fetchData = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const res = await getCustomizations({
        productId,
        page: targetPage,
        pageSize,
      })
      if (res.code === 0) {
        setData(res.data.items)
        setTotal(res.data.total)
        setPage(targetPage)
        setManageSheetOpen(false)
        setManagingItem(null)
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "获取客制化项目列表",
      })
      toast.error("数据加载异常，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  // ── Create ──
  const handleCreate = async () => {
    if (!createName.trim()) {
      toast.error("请输入项目名称")
      return
    }
    setCreating(true)
    try {
      const res = await createCustomization({
        productId,
        name: createName.trim(),
        sort: createSort.trim() === "" ? undefined : Number(createSort),
      })
      if (res.code === 0) {
        toast.success(res.message || "创建客制化项目成功")
        setCreateOpen(false)
        setCreateName("")
        setCreateSort("")
        await fetchData(1)
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "创建客制化项目",
      })
      toast.error("创建客制化项目失败，请稍后重试")
    } finally {
      setCreating(false)
    }
  }

  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [toggleConfirmItem, setToggleConfirmItem] = useState<Customization | null>(null)
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false)

  const handleToggleStatus = async (item: Customization) => {
    setToggleConfirmItem(item)
    setToggleConfirmOpen(true)
  }

  const confirmToggleStatus = async () => {
    if (!toggleConfirmItem) return
    const item = toggleConfirmItem
    setTogglingId(item.id)
    setToggleConfirmOpen(false)
    setToggleConfirmItem(null)
    try {
      const newStatus = item.status === CUSTOMIZATION_STATUS.DISABLED.value
        ? CUSTOMIZATION_STATUS.ACTIVE.value
        : CUSTOMIZATION_STATUS.DISABLED.value
      const res = await updateCustomizationStatus(item.id, newStatus)
      if (res.code === 0) {
        toast.success(res.message || "更新客制化项目状态成功")
        await fetchData(page)
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "更新客制化项目状态",
      })
      toast.error("更新客制化项目状态失败，请稍后重试")
    } finally {
      setTogglingId(null)
    }
  }

  const openBatchConfirm = (targetStatus: 0 | 1) => {
    if (selectedIds.size === 0) return
    setBatchConfirmAction(targetStatus)
    setBatchConfirmOpen(true)
  }

  const handleBatchStatusUpdate = async () => {
    if (selectedIds.size === 0) return
    setBatchUpdating(true)
    try {
      const res = await batchUpdateCustomizationStatus([...selectedIds], batchConfirmAction)
      if (res.code === 0) {
        toast.success(res.message || `已批量更新 ${res.data.updatedCount} 个客制化项目状态`)
        setBatchConfirmOpen(false)
        setSelectedIds(new Set())
        await fetchData(page)
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "批量更新客制化项目状态",
      })
      toast.error("批量更新客制化项目状态失败，请稍后重试")
    } finally {
      setBatchUpdating(false)
    }
  }

  // ── Export ──
  const handleExport = async () => {
    if (selectedIds.size === 0) {
      toast.error("请先选择要导出的客制化项目")
      return
    }
    setExporting(true)
    try {
      const res = await exportCustomization({
        productId,
        ids: Array.from(selectedIds),
      })
      if (res.code !== 0) return
      const payload = JSON.stringify(res.data.items, null, 2)
      const blob = new Blob([payload], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const namePart = res.data.items
        .map((it) => it.name)
        .join("、")
        .slice(0, 40)
      a.download = `客制化项目-${namePart || productId}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`已导出 ${res.data.items.length} 个客制化项目`)
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "导出客制化配置",
      })
      toast.error("导出失败，请稍后重试")
    } finally {
      setExporting(false)
    }
  }

  // ── Import ──
  const handleImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setImportText(String(reader.result ?? ""))
    }
    reader.onerror = () => toast.error("读取文件失败")
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!importText.trim()) {
      toast.error("请粘贴或上传客制化配置 JSON")
      return
    }
    let parsed: ImportCustomizationRequest
    try {
      const raw = JSON.parse(importText)
      const items = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.items)
          ? raw.items
          : (raw as ImportCustomizationRequest).items
      parsed = { productId, items }
    } catch {
      toast.error("JSON 格式无效，请检查后重试")
      return
    }
    if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
      toast.error("配置中未包含任何客制化项目")
      return
    }
    setImporting(true)
    try {
      const res = await importCustomization(parsed)
      if (res.code === 0) {
        toast.success(
          `导入成功：共 ${res.data.importedItemCount} 个项目、${res.data.importedOptionCount} 个选项（默认禁用）`,
        )
        setImportOpen(false)
        setImportText("")
        await fetchData(1)
      }
    } catch (err) {
      logger.error(extractBackendMessage(err) ?? "未知错误", {
        module: "商品",
        label: "导入客制化配置",
      })
      toast.error("导入失败，请确认配置格式正确")
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <DataTable
        toolbarLeft={
          <>
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              新建项目
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <UploadIcon data-icon="inline-start" />
              导入配置
            </Button>
            {selectedIds.size > 0 && (
              <div
                className="flex items-center gap-2"
                onMouseLeave={scheduleCloseBatchMenu}
              >
                <DropdownMenu open={batchMenuOpen} onOpenChange={setBatchMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      onMouseEnter={openBatchMenu}
                      onClick={openBatchMenu}
                    >
                      操作
                      <ChevronDownIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    onMouseEnter={openBatchMenu}
                    onMouseLeave={scheduleCloseBatchMenu}
                  >
                    <DropdownMenuItem
                      onClick={() => openBatchConfirm(CUSTOMIZATION_STATUS.ACTIVE.value as 1)}
                    >
                      批量激活
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => openBatchConfirm(CUSTOMIZATION_STATUS.DISABLED.value as 0)}
                    >
                      批量禁用
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExport}
                      disabled={exporting}
                    >
                      导出配置
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </>
        }
        header={
          <TableHeader className="sticky top-0 z-50 bg-background">
            <TableRow>
              <TableHead className="w-20">项目ID</TableHead>
              <TableHead>项目名称</TableHead>
              <TableHead className="w-20">排序</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-20">选项数</TableHead>
              <TableHead className="w-80 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
        }
        body={data.map((item) => (
          <TableRow key={item.id} data-id={item.id}>
            <TableCell className="font-mono text-xs">{item.id}</TableCell>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="font-mono text-xs">{item.sort}</TableCell>
            <TableCell>
              <span className={CUSTOMIZATION_STATUS_TEXT_CLASSES[item.status] ?? ""}>
                {CUSTOMIZATION_STATUS_LABEL[item.status]}
              </span>
            </TableCell>
            <TableCell className="font-mono text-xs">
              {(item.optionCount ?? 0)}（
              <span className="text-green-600 dark:text-green-400">{item.activeOptionCount ?? 0}</span>
              {' / '}
              <span className="text-destructive">{item.disabledOptionCount ?? 0}</span>
              ）
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingItem(item)
                    setEditOpen(true)
                  }}
                >
                  编辑项目
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setManagingItem(item)
                    setManageSheetOpen(true)
                  }}
                >
                  管理选项
                </Button>
                <Button
                  variant={item.status === CUSTOMIZATION_STATUS.DISABLED.value ? "outline-success" : "outline-destructive"}
                  size="sm"
                  onClick={() => handleToggleStatus(item)}
                  disabled={togglingId === item.id}
                >
                  {item.status === CUSTOMIZATION_STATUS.DISABLED.value ? "激活" : "禁用"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        loading={loading}
        isEmpty={data.length === 0}
        colSpan={6}
        showSelection
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRefresh={() => fetchData(page)}
        refreshDisabled={loading}
        emptyIcon={<ListIcon className="size-4" />}
        emptyText="暂无数据"
        pagination={{ page, pageSize, total, onPageChange: fetchData }}
      />

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建客制化项目</DialogTitle>
          </DialogHeader>

          <FieldGroup className="py-2">
            <Field>
              <FieldLabel htmlFor="create-name">
                项目名称
              </FieldLabel>
              <Input
                id="create-name"
                value={createName}
                placeholder="例如：温度、甜度..."
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate()
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="create-sort">排序序号</FieldLabel>
              <Input
                id="create-sort"
                type="number"
                placeholder="留空默认为 0"
                value={createSort}
                onChange={(e) => setCreateSort(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate()
                }}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "处理中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      {editingItem && (
        <EditCustomizationDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open)
            if (!open) setEditingItem(null)
          }}
          item={editingItem}
          onUpdated={() => fetchData(page)}
        />
      )}

      {/* ── Manage Options Sheet ── */}
      {managingItem && (
        <ManageOptionsSheet
          customizationId={managingItem.id}
          customizationName={managingItem.name}
          open={manageSheetOpen}
          onOpenChange={(open) => {
            setManageSheetOpen(open)
            if (!open) setManagingItem(null)
          }}
        />
      )}

      {/* ── Toggle Status Confirm Dialog ── */}
      <ConfirmDialog
        open={toggleConfirmOpen}
        onOpenChange={setToggleConfirmOpen}
        title="确认切换状态"
        description={
          <>
            确定将「{toggleConfirmItem?.name}」项目
            {toggleConfirmItem?.status === CUSTOMIZATION_STATUS.DISABLED.value ? "激活" : "禁用"}吗？
          </>
        }
        confirmText="确定"
        loading={togglingId !== null}
        onConfirm={confirmToggleStatus}
      />

      {/* ── Batch Status Confirm Dialog ── */}
      <ConfirmDialog
        open={batchConfirmOpen}
        onOpenChange={setBatchConfirmOpen}
        title="操作确认"
        description={
          <>
            确定将 {selectedIds.size} 个客制化项目批量
            {batchConfirmAction === CUSTOMIZATION_STATUS.ACTIVE.value ? "激活" : "禁用"}吗？
          </>
        }
        confirmText="确定"
        cancelText="取消"
        loading={batchUpdating}
        onConfirm={handleBatchStatusUpdate}
      />

      {/* ── Import Dialog ── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>导入客制化配置</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              将导出的 JSON 粘贴到下方，或上传 .json 文件。导入后项目与选项均默认为
              <span className="text-destructive">禁用</span>状态，需手动激活。
            </p>
            <Textarea
              className="h-64 font-mono text-xs"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <label
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "cursor-pointer",
                )}
              >
                上传 JSON 文件
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImportFile(file)
                    e.target.value = ""
                  }}
                />
              </label>
              {importText.trim() && (
                <Button variant="ghost" size="sm" onClick={() => setImportText("")}>
                  清空
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "导入中..." : "导入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
