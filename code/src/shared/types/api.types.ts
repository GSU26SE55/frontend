export interface ErrorEntity {
  field: string
  detail: string
}

export interface ResponseData<T> {
  isSuccess: boolean
  message: string
  data: T | null
  listErrors: ErrorEntity[]
}

export interface PaginationResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}
