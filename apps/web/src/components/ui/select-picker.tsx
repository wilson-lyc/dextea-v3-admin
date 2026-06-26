"use client"

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

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
  const selectedLabel = React.useMemo(() => {
    const option = options.find((opt) => opt.value === value)
    return option?.label ?? ""
  }, [options, value])

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <span className="flex flex-1 text-left data-placeholder:text-muted-foreground">
          {selectedLabel || placeholder}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
