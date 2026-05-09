export interface ResponseData<T> {
  isSuccess: boolean
  message?: string
  data?: T
  listErrors?: { field: string; detail: string }[]
}

export interface PaginationResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export interface ErrorEntity {
  field: string
  detail: string
}
