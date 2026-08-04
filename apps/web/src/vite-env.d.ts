/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_AUTH_BASE_URL: string
  readonly VITE_API_STORE_BASE_URL: string
  readonly VITE_API_EMPLOYEE_BASE_URL: string
  readonly VITE_API_PRODUCT_BASE_URL: string
  readonly VITE_API_TAG_BASE_URL: string
  readonly VITE_API_AREA_BASE_URL: string
  readonly VITE_API_CONFIG_BASE_URL: string
  readonly VITE_API_CUSTOMIZATION_BASE_URL: string
  readonly VITE_API_INGREDIENT_BASE_URL: string
  readonly VITE_API_DASHBOARD_BASE_URL: string
  readonly VITE_API_MENU_BASE_URL: string
  readonly VITE_API_INIT_BASE_URL: string
  readonly VITE_API_ROLE_BASE_URL: string
  readonly VITE_API_PERMISSION_BASE_URL: string
  readonly VITE_API_GALLERY_BASE_URL?: string
  readonly VITE_API_HEALTH_BASE_URL: string
  readonly VITE_ENABLE_API_LOG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
