"use client"

import { useCallback, useEffect, useState } from "react"

import type { Division } from "@/api"
import { getProvinces, getChildren, getDivisionPath } from "@/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox"

export interface AreaValue {
  /** 最细一级行政区划代码（6 位）；按地域分发等仅用名称的场景可省略 */
  code?: string
  province: string
  city: string
  district: string
}

interface AreaSelectorProps {
  /** 当前选中的省市区，用于初始化回显。优先使用 code 反查，其次按名称匹配 */
  value?: Partial<AreaValue>
  /** 选择变化时的回调（同时返回 code 与名称） */
  onChange?: (value: AreaValue) => void
  /** 是否禁用所有选择器 */
  disabled?: boolean
  /** 额外的 wrapper className */
  className?: string
}

export function AreaSelector({
  value,
  onChange,
  disabled = false,
  className,
}: AreaSelectorProps) {
  const [provinces, setProvinces] = useState<Division[]>([])
  const [cities, setCities] = useState<Division[]>([])
  const [districts, setDistricts] = useState<Division[]>([])
  const [selectedProvince, setSelectedProvince] = useState<Division | null>(null)
  const [selectedCity, setSelectedCity] = useState<Division | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<Division | null>(null)
  const [areasLoading, setAreasLoading] = useState(false)

  // 回显用的行政区划链路（由 code 反查得到）
  const [echoChain, setEchoChain] = useState<Division[] | null>(null)

  // ── 加载省份列表 ──────────────────────────────────
  useEffect(() => {
    if (disabled) return

    setAreasLoading(true)
    getProvinces().then((res) => {
      if (res.code === 0) {
        setProvinces(res.data)
      }
      setAreasLoading(false)
    })
  }, [disabled])

  // ── 回显：通过 code 反查完整链路并设置省 ─────────────
  useEffect(() => {
    if (!value?.code || !provinces.length) return
    let cancelled = false
    getDivisionPath(value.code).then((res) => {
      if (cancelled || res.code !== 0 || res.data.length === 0) return
      setEchoChain(res.data)
      setSelectedProvince(res.data[0] ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [value?.code, provinces])

  // ── 回显：省级加载完成后设置市 ──────────────────────
  useEffect(() => {
    if (!echoChain || echoChain.length < 2 || cities.length === 0) return
    const target = echoChain[1]
    const matched = cities.find((c) => c.code === target.code)
    if (matched) {
      setSelectedCity((prev) => (prev?.code === matched.code ? prev : matched))
    }
  }, [echoChain, cities])

  // ── 回显：市级加载完成后设置区，并结束回显 ────────────
  useEffect(() => {
    if (!echoChain || echoChain.length < 3 || districts.length === 0) return
    const target = echoChain[2]
    const matched = districts.find((d) => d.code === target.code)
    if (matched) {
      setSelectedDistrict((prev) => (prev?.code === matched.code ? prev : matched))
      setEchoChain(null)
    }
  }, [echoChain, districts])

  // ── 回显（兼容）：按名称匹配初始省份 ─────────────────
  useEffect(() => {
    if (!value?.province || !provinces.length || value?.code) return
    const matched = provinces.find((p) => p.name === value.province)
    if (matched && (!selectedProvince || selectedProvince.code !== matched.code)) {
      setSelectedProvince(matched)
    }
  }, [provinces, value?.province, value?.code])

  // ── 省份变化 → 清空下级并加载城市列表 ────────────────
  useEffect(() => {
    if (!selectedProvince) {
      setCities([])
      setSelectedCity(null)
      setDistricts([])
      setSelectedDistrict(null)
      return
    }

    setSelectedCity(null)
    setSelectedDistrict(null)
    setCities([])
    setDistricts([])

    getChildren(selectedProvince.code).then((res) => {
      if (res.code === 0) setCities(res.data)
    })
  }, [selectedProvince])

  // ── 回显（兼容）：按名称匹配初始城市 ─────────────────
  useEffect(() => {
    if (!value?.city || !cities.length || !selectedProvince || value?.code) return
    const matched = cities.find((c) => c.name === value.city)
    if (matched && (!selectedCity || selectedCity.code !== matched.code)) {
      setSelectedCity(matched)
    }
  }, [cities, value?.city, selectedProvince, value?.code])

  // ── 城市变化 → 清空下级并加载区县列表 ────────────────
  useEffect(() => {
    if (!selectedCity) {
      setDistricts([])
      setSelectedDistrict(null)
      return
    }

    setSelectedDistrict(null)
    setDistricts([])

    getChildren(selectedCity.code).then((res) => {
      if (res.code === 0) setDistricts(res.data)
    })
  }, [selectedCity])

  // ── 回显（兼容）：按名称匹配初始区县 ─────────────────
  useEffect(() => {
    if (!value?.district || !districts.length || !selectedCity || value?.code) return
    const matched = districts.find((d) => d.name === value.district)
    if (matched && (!selectedDistrict || selectedDistrict.code !== matched.code)) {
      setSelectedDistrict(matched)
    }
  }, [districts, value?.district, selectedCity, value?.code])

  // ── 用户交互回调（不触发自动回显）───────────────────
  const handleProvinceChange = useCallback(
    (item: Division | null) => {
      setSelectedProvince(item)
      setSelectedCity(null)
      setSelectedDistrict(null)
      setCities([])
      setDistricts([])
      onChange?.({
        code: item?.code ?? "",
        province: item?.name ?? "",
        city: "",
        district: "",
      })
    },
    [onChange],
  )

  const handleCityChange = useCallback(
    (item: Division | null) => {
      setSelectedCity(item)
      setSelectedDistrict(null)
      setDistricts([])
      if (selectedProvince) {
        onChange?.({
          code: item?.code ?? "",
          province: selectedProvince.name,
          city: item?.name ?? "",
          district: "",
        })
      }
    },
    [selectedProvince, onChange],
  )

  const handleDistrictChange = useCallback(
    (item: Division | null) => {
      setSelectedDistrict(item)
      if (selectedProvince && selectedCity) {
        onChange?.({
          code: item?.code ?? "",
          province: selectedProvince.name,
          city: selectedCity.name,
          district: item?.name ?? "",
        })
      }
    },
    [selectedProvince, selectedCity, onChange],
  )

  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {/* 省 */}
      <Combobox
        items={provinces}
        value={selectedProvince}
        onValueChange={handleProvinceChange}
        itemToStringValue={(item: Division | null) => item?.name ?? ""}
      >
        <ComboboxTrigger
          render={
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
              disabled={areasLoading || disabled}
            />
          }
        >
          {selectedProvince ? (
            selectedProvince.name
          ) : (
            <span className="text-muted-foreground">选择省</span>
          )}
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

      {/* 市 */}
      <Combobox
        items={cities}
        value={selectedCity}
        onValueChange={handleCityChange}
        itemToStringValue={(item: Division | null) => item?.name ?? ""}
      >
        <ComboboxTrigger
          render={
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
              disabled={!selectedProvince || disabled}
            />
          }
        >
          {selectedCity ? (
            selectedCity.name
          ) : (
            <span className="text-muted-foreground">选择市</span>
          )}
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

      {/* 区 */}
      <Combobox
        items={districts}
        value={selectedDistrict}
        onValueChange={handleDistrictChange}
        itemToStringValue={(item: Division | null) => item?.name ?? ""}
      >
        <ComboboxTrigger
          render={
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
              disabled={!selectedCity || disabled}
            />
          }
        >
          {selectedDistrict ? (
            selectedDistrict.name
          ) : (
            <span className="text-muted-foreground">选择区</span>
          )}
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
  )
}
