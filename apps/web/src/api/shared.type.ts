export type ApiResponse<T = unknown> = {
  code: number
  data: T
  message: string
}

export type PaginatedData<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>
