/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENABLE_API_LOG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
