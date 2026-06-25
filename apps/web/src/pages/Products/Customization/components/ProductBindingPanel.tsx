import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LinkIcon, SettingsIcon, Trash2Icon } from "lucide-react"
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
import { getBoundProducts, bindProduct, unbindProduct } from "@/services"

interface ProductBindingPanelProps {
  customizationId: number
}

export default function ProductBindingPanel({ customizationId }: ProductBindingPanelProps) {
  const navigate = useNavigate()
  const [products, setProducts] = useState<{ productId: number; productName: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [inputValue, setInputValue] = useState("")
  const [binding, setBinding] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getBoundProducts(customizationId)
      if (res.code === 0) {
        setProducts(res.data)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("获取绑定的商品列表失败")
    } finally {
      setLoading(false)
    }
  }, [customizationId])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleBind = async () => {
    const productId = Number(inputValue)
    if (!productId || productId <= 0) {
      toast.error("请输入有效的商品ID")
      return
    }

    setBinding(true)
    try {
      const res = await bindProduct(customizationId, productId)
      if (res.code === 0) {
        toast.success(res.message)
        setInputValue("")
        await fetchProducts()
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

  const handleUnbind = async (productId: number) => {
    try {
      const res = await unbindProduct(customizationId, productId)
      if (res.code === 0) {
        toast.success(res.message)
        await fetchProducts()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? (err instanceof Error ? err.message : "解绑失败"))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="输入商品ID"
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
        <div className="py-8 text-center text-sm text-muted-foreground">
          加载中...
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">商品ID</TableHead>
              <TableHead>商品名称</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  暂未绑定商品
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.productId}>
                  <TableCell className="font-mono text-xs">{p.productId}</TableCell>
                  <TableCell>{p.productName}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/products/${p.productId}`)}>
                        <SettingsIcon data-icon="inline-start" />
                        管理
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-500"
                        onClick={() => handleUnbind(p.productId)}
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
