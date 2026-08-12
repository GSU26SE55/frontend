export interface ErrorEntity {
  field: string;
  detail: string;
}

export interface CommonResponse<T = undefined> {
  isSuccess: boolean;
  message?: string;
  data?: T;
  listErrors: ErrorEntity[];
}

export interface PaginationResponse<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
