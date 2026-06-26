"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

export interface SelectOption {
  label: string
  value: string
}

interface SelectPickerProps {
  options: SelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function SelectPicker({
  options,
  value,
  onValueChange,
  placeholder = "请选择",
  className,
  disabled,
}: SelectPickerProps) {
  const selected = React.useMemo(
    () => options.find((opt) => opt.value === value) ?? null,
    [options, value],
  )

  return (
    <Combobox
      items={options}
      itemToStringValue={(opt: SelectOption) => opt.label}
      value={selected}
      onValueChange={(opt: SelectOption | null) => {
        if (opt) onValueChange(opt.value)
      }}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={placeholder}
        className={cn(className)}
      />
      <ComboboxContent>
        <ComboboxEmpty>未找到匹配项</ComboboxEmpty>
        <ComboboxList>
          {(opt: SelectOption) => (
            <ComboboxItem key={opt.value} value={opt}>
              {opt.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
