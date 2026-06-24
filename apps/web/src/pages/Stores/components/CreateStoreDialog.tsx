import { useEffect, useState } from "react"
import { toast } from "sonner"

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { createStore } from "@/services"
import { getProvinces, getChildren } from "@/services"

interface CreateStoreDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateStoreDialog({ open, onOpenChange, onCreated }: CreateStoreDialogProps) {
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

  useEffect(() => {
    if (!open) {
      setProvinces([])
      setCities([])
      setDistricts([])
      setSelectedProvince(null)
      setSelectedCity(null)
      setSelectedDistrict(null)
      setFormName("")
      setFormProvince("")
      setFormCity("")
      setFormDistrict("")
      setFormAddress("")
      setFormBusinessHours("")
      setFormPhone("")
      return
    }

    setAreasLoading(true)
    getProvinces().then((res) => {
      if (res.code === 0) {
        setProvinces(res.data)
      }
      setAreasLoading(false)
    })
  }, [open])

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

  useEffect(() => {
    setFormDistrict(selectedDistrict?.name ?? "")
  }, [selectedDistrict])

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
        onOpenChange(false)
        onCreated()
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "提交中..." : "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
