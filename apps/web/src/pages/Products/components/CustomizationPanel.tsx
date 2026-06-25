import { useCallback, useEffect, useState } from "react"
import { LinkIcon, SettingsIcon, Trash2Icon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

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
import { getBoundCustomizations, addProductCustomization, removeProductCustomization } from "@/services"

interface CustomizationPanelProps {
  productId: number
}

interface BoundCustomization {
  customizationId: number
  customizationName: string
  displayName: string
}

export default function CustomizationPanel({ productId }: CustomizationPanelProps) {
  const navigate = useNavigate()
  const [customizations, setCustomizations] = useState<BoundCustomization[]>([])
  const [loading, setLoading] = useState(true)
  const [inputValue, setInputValue] = useState("")
  const [binding, setBinding] = useState(false)

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
    const customizationId = Number(inputValue)
    if (!customizationId || customizationId <= 0) {
      toast.error("请输入有效的客制化项目ID")
      return
    }

    setBinding(true)
    try {
      const res = await addProductCustomization(productId, customizationId)
      if (res.code === 0) {
        toast.success(res.message)
        setInputValue("")
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="输入客制化项目ID"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleBind()
          }}
          className="w-48"
        />
        <Button onClick={handleBind} disabled={binding}>
          <LinkIcon data-icon="inline-start" />
          {binding ? "绑定中..." : "绑定"}
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          加载中...
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">项目ID</TableHead>
              <TableHead className="w-1/2">名称</TableHead>
              <TableHead className="w-1/2">展示名称</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  暂未绑定客制化项目
                </TableCell>
              </TableRow>
            ) : (
              customizations.map((c) => (
                <TableRow key={c.customizationId}>
                  <TableCell className="font-mono text-xs">{c.customizationId}</TableCell>
                  <TableCell>{c.customizationName}</TableCell>
                  <TableCell>{c.displayName || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/products/customization/${c.customizationId}`)}
                      >
                        <SettingsIcon className="size-4" />
                        管理
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
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
