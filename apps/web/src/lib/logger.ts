const ENABLED = import.meta.env.VITE_ENABLE_API_LOG === "true"

type LogLevel = "info" | "warn" | "error"

interface LogMeta {
  module?: string
  label?: string
}

function emit(level: LogLevel, message: string, meta?: LogMeta) {
  if (!ENABLED) return
  const prefix = "[api-log]"
  const tag = meta?.module ? `[${meta.module}]` : ""
  const label = meta?.label ? `[${meta.label}]` : ""
  const consoleMethod =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log
  consoleMethod(`${prefix}${tag}${label} ${message}`)
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    emit("info", message, meta)
  },
  warn(message: string, meta?: LogMeta) {
    emit("warn", message, meta)
  },
  error(message: string, meta?: LogMeta) {
    emit("error", message, meta)
  },
}

export function isApiLogEnabled() {
  return ENABLED
}

interface BusinessError extends Error {
  businessMessage?: string
}

export function extractBackendMessage(err: unknown): string | undefined {
  if (err && typeof err === "object" && "businessMessage" in err) {
    const m = (err as BusinessError).businessMessage
    if (m) return m
  }
  if (err instanceof Error) return err.message
  return undefined
}
