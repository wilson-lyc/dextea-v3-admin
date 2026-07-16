import { useCallback, useEffect, useState } from "react"
import { SearchIcon, UserCircleIcon } from "lucide-react"
import { toast } from "sonner"

import type { Customer, GetCustomerListRequest } from "@dextea-admin/contracts"
import {
  CUSTOMER_STATUS,
  CUSTOMER_STATUS_LABEL,
  CUSTOMER_STATUS_TEXT_CLASSES,
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
import { StatusSelectPicker } from "@/components/ui/status-select-picker"
import { getCustomers } from "@/api"

/** 平台值 → 中文标签 */
const CUSTOMER_PLATFORM_LABEL: Record<number, string> = {
  1: "微信",
  2: "支付宝",
  3: "Web",
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // 已应用的筛选条件
  const [search, setSearch] = useState<Partial<GetCustomerListRequest>>({})

  // 搜索框草稿值
  const [idInput, setIdInput] = useState("")
  const [nameInput, setNameInput] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [phoneInput, setPhoneInput] = useState("")
  const [statusInput, setStatusInput] = useState("")

  const hasFilter = Object.keys(search).length > 0

  const fetchCustomers = useCallback(
    async (targetPage: number) => {
      setLoading(true)
      try {
        const params: Partial<GetCustomerListRequest> = {
          page: targetPage,
          pageSize,
        }
        if (search.id !== undefined) params.id = search.id
        if (search.status !== undefined) params.status = search.status
        if (search.name) params.name = search.name
        if (search.email) params.email = search.email
        if (search.phone) params.phone = search.phone

        const res = await getCustomers(params)
        if (res.code === 0) {
          setCustomers(res.data.items)
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
    },
    [search, pageSize],
  )

  // 刷新（强制等待 1 秒）
  const handleRefresh = useCallback(async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await fetchCustomers(page)
    toast.success("刷新成功")
  }, [fetchCustomers, page])

  useEffect(() => {
    fetchCustomers(1)
  }, [fetchCustomers])

  const handleSearch = () => {
    const next: Partial<GetCustomerListRequest> = {}
    if (idInput.trim()) next.id = Number(idInput)
    if (nameInput.trim()) next.name = nameInput.trim()
    if (emailInput.trim()) next.email = emailInput.trim()
    if (phoneInput.trim()) next.phone = phoneInput.trim()
    if (statusInput !== "") next.status = Number(statusInput)
    setSearch(next)
  }

  const handleClear = () => {
    setIdInput("")
    setNameInput("")
    setEmailInput("")
    setPhoneInput("")
    setStatusInput("")
    setSearch({})
  }

  return (
    <DataTable
      className="p-6"
      toolbarRight={
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="用户 ID"
            className="w-24"
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch()
            }}
          />
          <Input
            placeholder="名称"
            className="w-28"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch()
            }}
          />
          <Input
            placeholder="邮箱"
            className="w-44"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch()
            }}
          />
          <Input
            placeholder="手机号"
            className="w-32"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch()
            }}
          />
          <StatusSelectPicker
            statusEnum={CUSTOMER_STATUS}
            labels={CUSTOMER_STATUS_LABEL}
            value={statusInput}
            onValueChange={setStatusInput}
            placeholder="状态"
            className="w-28"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <SearchIcon data-icon="inline-start" />
            搜索
          </Button>
          {hasFilter && (
            <Button variant="ghost" onClick={handleClear}>
              清除
            </Button>
          )}
        </div>
      }
      header={
        <TableHeader className="sticky top-0 z-50 bg-background">
          <TableRow>
            <TableHead className="w-20">ID</TableHead>
            <TableHead className="w-32">名称</TableHead>
            <TableHead className="w-48">邮箱</TableHead>
            <TableHead className="w-32">手机号</TableHead>
            <TableHead className="w-24">平台</TableHead>
            <TableHead className="w-48">微信 OpenID</TableHead>
            <TableHead className="w-48">支付宝 OpenID</TableHead>
            <TableHead className="w-20">状态</TableHead>
            <TableHead className="w-40">创建时间</TableHead>
            <TableHead className="w-40">更新时间</TableHead>
          </TableRow>
        </TableHeader>
      }
      body={customers.map((customer) => (
        <TableRow key={customer.id}>
          <TableCell className="font-mono text-xs">{customer.id}</TableCell>
          <TableCell>{customer.name ?? "-"}</TableCell>
          <TableCell>{customer.email ?? "-"}</TableCell>
          <TableCell>{customer.phone ?? "-"}</TableCell>
          <TableCell>{CUSTOMER_PLATFORM_LABEL[customer.platform] ?? "未知"}</TableCell>
          <TableCell className="max-w-48 truncate font-mono text-xs">
            {customer.weixinOpenId ?? "-"}
          </TableCell>
          <TableCell className="max-w-48 truncate font-mono text-xs">
            {customer.alipayOpenId ?? "-"}
          </TableCell>
          <TableCell>
            <span className={CUSTOMER_STATUS_TEXT_CLASSES[customer.status] ?? ""}>
              {CUSTOMER_STATUS_LABEL[customer.status]}
            </span>
          </TableCell>
          <TableCell className="text-xs text-muted-foreground">{customer.createdAt}</TableCell>
          <TableCell className="text-xs text-muted-foreground">{customer.updatedAt}</TableCell>
        </TableRow>
      ))}
      loading={loading}
      isEmpty={customers.length === 0}
      colSpan={10}
      onRefresh={handleRefresh}
      refreshDisabled={loading}
      emptyIcon={<UserCircleIcon className="size-4" />}
      emptyText="暂无数据"
      pagination={{ page, pageSize, total, onPageChange: fetchCustomers }}
    />
  )
}
