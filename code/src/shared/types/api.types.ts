export type ResponseData<T> = {
  data: T
  message?: string
  success: boolean
}

export type PaginationResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type ErrorEntity = {
  code?: string
  message: string
  details?: Record<string, unknown>
}
