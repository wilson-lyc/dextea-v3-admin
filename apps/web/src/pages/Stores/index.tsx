import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2Icon, PlusIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import type { Store, StoreStatus } from "@dextea/shared-types"
import type { Division } from "@/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { getStores, createStore } from "@/services"
import { getProvinces, getChildren } from "@/services"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const STATUS_LABELS: Record<StoreStatus, string> = {
  0: "休息中",
  1: "营业中",
  2: "筹备中",
  3: "门店已注销",
}

const STATUS_CLASSES: Record<StoreStatus, string> = {
  0: "text-red-600 dark:text-red-400",
  1: "text-green-600 dark:text-green-400",
  2: "text-blue-600 dark:text-blue-400",
  3: "text-muted-foreground",
}

export default function StoresPage() {
  const navigate = useNavigate()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formProvince, setFormProvince] = useState("")
  const [formCity, setFormCity] = useState("")
  const [formDistrict, setFormDistrict] = useState("")
  const [formAddress, setFormAddress] = useState("")
  const [formBusinessHours, setFormBusinessHours] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [provinces, setProvinces] = useState<Division[]>([])
  const [cities, setCities] = useState<Division[]>([])
  const [districts, setDistricts] = useState<Division[]>([])
  const [selectedProvince, setSelectedProvince] = useState<Division | null>(null)
  const [selectedCity, setSelectedCity] = useState<Division | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<Division | null>(null)
  const [areasLoading, setAreasLoading] = useState(false)

  const fetchStores = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const params: { page?: number; pageSize?: number; keyword?: string } = { page: targetPage, pageSize }
      if (searchKeyword) {
        params.keyword = searchKeyword
      }
      const res = await getStores(params)
      setStores(res.data.items)
      setTotal(res.data.total)
      setPage(targetPage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "获取门店列表失败")
    } finally {
      setLoading(false)
    }
  }, [searchKeyword, pageSize])

  useEffect(() => {
    fetchStores(1)
  }, [fetchStores])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  // Fetch provinces when dialog opens
  useEffect(() => {
    if (!dialogOpen) {
      setProvinces([])
      setCities([])
      setDistricts([])
      setSelectedProvince(null)
      setSelectedCity(null)
      setSelectedDistrict(null)
      return
    }

    setAreasLoading(true)
    getProvinces().then((res) => {
      if (res.code === 0) {
        setProvinces(res.data)
      }
      setAreasLoading(false)
    })
  }, [dialogOpen])

  // Fetch cities when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setCities([])
      setSelectedCity(null)
      setDistricts([])
      setSelectedDistrict(null)
      return
    }

    setFormProvince(selectedProvince.name)
    getChildren(selectedProvince.code).then((res) => {
      if (res.code === 0) {
        setCities(res.data)
      }
    })
  }, [selectedProvince])

  // Fetch districts when city changes
  useEffect(() => {
    if (!selectedCity) {
      setDistricts([])
      setSelectedDistrict(null)
      return
    }

    setFormCity(selectedCity.name)
    getChildren(selectedCity.code).then((res) => {
      if (res.code === 0) {
        setDistricts(res.data)
      }
    })
  }, [selectedCity])

  // Sync district name when selected
  useEffect(() => {
    setFormDistrict(selectedDistrict?.name ?? "")
  }, [selectedDistrict])

  const openCreateDialog = () => {
    setFormName("")
    setFormProvince("")
    setFormCity("")
    setFormDistrict("")
    setFormAddress("")
    setFormBusinessHours("")
    setFormPhone("")
    setSelectedProvince(null)
    setSelectedCity(null)
    setSelectedDistrict(null)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formName) {
      toast.error("门店名称不能为空")
      return
    }

    setSubmitting(true)
    try {
      const res = await createStore({
        name: formName,
        province: formProvince,
        city: formCity,
        district: formDistrict,
        address: formAddress,
        businessHours: formBusinessHours,
        phone: formPhone,
      })
      if (res.code === 0) {
        toast.success(res.message)
        setDialogOpen(false)
        await fetchStores(1)
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSearch = () => {
    setSearchKeyword(keyword)
  }

  const fullAddress = (store: Store) => {
    return [store.province, store.city, store.district, store.address]
      .filter(Boolean)
      .join(" ")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Button onClick={openCreateDialog}>
          <PlusIcon data-icon="inline-start" />
          创建门店
        </Button>
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索门店名称、电话、地址"
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>门店名称</TableHead>
              <TableHead>地址</TableHead>
              <TableHead>联系电话</TableHead>
              <TableHead>营业时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  暂无门店数据
                </TableCell>
              </TableRow>
            ) : (
              stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-mono text-xs">{store.id}</TableCell>
                  <TableCell className="font-medium">{store.name}</TableCell>
                  <TableCell className="max-w-60 truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{fullAddress(store)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{fullAddress(store)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{store.phone || "-"}</TableCell>
                  <TableCell>{store.businessHours || "-"}</TableCell>
                  <TableCell>
                    <span className={STATUS_CLASSES[store.status]}>
                      {STATUS_LABELS[store.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/stores/${store.id}`)}>
                      管理
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </TooltipProvider>
      )}

      {!loading && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page > 1) fetchStores(page - 1) }}
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
                for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
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
                      onClick={(e: React.MouseEvent) => { e.preventDefault(); fetchStores(p) }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )
            })()}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page < Math.ceil(total / pageSize)) fetchStores(page + 1) }}
                text="下一页"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>创建门店</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="store-name">
                门店名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="store-name"
                placeholder="请输入门店名称"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>省市区 <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-3 gap-3">
              <Combobox
                items={provinces}
                value={selectedProvince}
                onValueChange={setSelectedProvince}
                itemToStringValue={(item: Division | null) => item?.name ?? ""}
              >
                <ComboboxTrigger
                  render={
                    <Button variant="outline" className="w-full justify-between font-normal" disabled={areasLoading} />
                  }
                >
                  {selectedProvince ? selectedProvince.name : <span className="text-muted-foreground">选择省</span>}
                </ComboboxTrigger>
                <ComboboxContent>
                  <ComboboxInput showTrigger={false} placeholder="搜索省..." />
                  <ComboboxEmpty>未找到</ComboboxEmpty>
                  <ComboboxList>
                    {(item: Division) => (
                      <ComboboxItem key={item.code} value={item}>
                        {item.name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <Combobox
                items={cities}
                value={selectedCity}
                onValueChange={setSelectedCity}
                itemToStringValue={(item: Division | null) => item?.name ?? ""}
              >
                <ComboboxTrigger
                  render={
                    <Button variant="outline" className="w-full justify-between font-normal" disabled={!selectedProvince} />
                  }
                >
                  {selectedCity ? selectedCity.name : <span className="text-muted-foreground">选择市</span>}
                </ComboboxTrigger>
                <ComboboxContent>
                  <ComboboxInput showTrigger={false} placeholder="搜索市..." />
                  <ComboboxEmpty>未找到</ComboboxEmpty>
                  <ComboboxList>
                    {(item: Division) => (
                      <ComboboxItem key={item.code} value={item}>
                        {item.name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <Combobox
                items={districts}
                value={selectedDistrict}
                onValueChange={setSelectedDistrict}
                itemToStringValue={(item: Division | null) => item?.name ?? ""}
              >
                <ComboboxTrigger
                  render={
                    <Button variant="outline" className="w-full justify-between font-normal" disabled={!selectedCity} />
                  }
                >
                  {selectedDistrict ? selectedDistrict.name : <span className="text-muted-foreground">选择区</span>}
                </ComboboxTrigger>
                <ComboboxContent>
                  <ComboboxInput showTrigger={false} placeholder="搜索区..." />
                  <ComboboxEmpty>未找到</ComboboxEmpty>
                  <ComboboxList>
                    {(item: Division) => (
                      <ComboboxItem key={item.code} value={item}>
                        {item.name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="store-address">
                具体地址 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="store-address"
                placeholder="请输入具体地址"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="store-phone">
                  联系电话 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="store-phone"
                  placeholder="请输入联系电话"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="store-hours">
                  营业时间 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="store-hours"
                  placeholder="例如：09:00-22:00"
                  value={formBusinessHours}
                  onChange={(e) => setFormBusinessHours(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "提交中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
