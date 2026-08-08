import type { ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: "destructive" | "default"
  loading?: boolean
  errorMessage?: string | null
  onConfirm: () => void
}

/** 通用二次确认弹窗 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title = "确认操作",
  description,
  confirmText = "确认",
  cancelText = "取消",
  variant = "default",
  loading = false,
  errorMessage,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={variant}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "处理中..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
