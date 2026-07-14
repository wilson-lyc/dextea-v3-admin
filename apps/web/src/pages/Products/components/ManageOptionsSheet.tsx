import { useCallback, useRef, useState } from "react"
import { GripVerticalIcon } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import CustomizationOptionsPanel from "./CustomizationOptionsPanel"

interface ManageOptionsSheetProps {
  customizationId: number
  customizationName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MIN_SHEET_WIDTH = 600
const MAX_SHEET_WIDTH_RATIO = 0.9

export default function ManageOptionsSheet({
  customizationId,
  customizationName,
  open,
  onOpenChange,
}: ManageOptionsSheetProps) {
  const [sheetWidth, setSheetWidth] = useState(840)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isResizing.current = true
      startX.current = e.clientX
      startWidth.current = sheetWidth

      document.body.style.cursor = "ew-resize"
      document.body.style.userSelect = "none"

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current) return
        const diff = startX.current - moveEvent.clientX
        const panelWidth = startWidth.current + diff
        const maxWidth = window.innerWidth * MAX_SHEET_WIDTH_RATIO
        setSheetWidth(Math.max(MIN_SHEET_WIDTH, Math.min(panelWidth, maxWidth)))
      }

      const handleMouseUp = () => {
        isResizing.current = false
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [sheetWidth],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" style={{ width: sheetWidth, maxWidth: "none" }} className="gap-0">
        <SheetHeader>
          <SheetTitle>客制化选项管理 - {customizationName}</SheetTitle>
        </SheetHeader>

        <div
          className="absolute left-0 top-0 z-20 flex h-full w-4 cursor-ew-resize items-center justify-center opacity-0 transition-opacity hover:opacity-100"
          onMouseDown={handleResizeStart}
        >
          <div className="flex h-8 w-0.5 items-center justify-center rounded-full bg-border">
            <GripVerticalIcon className="size-3 text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <CustomizationOptionsPanel customizationId={customizationId} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
