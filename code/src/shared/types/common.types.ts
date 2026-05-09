export interface BaseFilterPagination {
  pageNumber?: number
  pageSize?: number
  search?: string
  isDescending?: boolean
}

export type UserRole = 'Admin' | 'Manager' | 'Staff'
