import type {
  ImportBatchStatusEnum,
  ImportEntityTypeEnum,
  ImportRowStatusEnum,
} from "@/shared/enums/import/import.enum";
import type { ErrorEntity } from "@/shared/types/api.types";

export {
  ImportBatchStatusEnum,
  ImportEntityTypeEnum,
  ImportRowStatusEnum,
} from "@/shared/enums/import/import.enum";

export interface ImportEntityCountDto {
  entityType: ImportEntityTypeEnum;
  total: number;
  invalid: number;
}

export interface ImportBatchDto {
  id: string;
  fileName: string | null;
  status: ImportBatchStatusEnum;
  isDryRun: boolean;
  requestedBy: string | null;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createdRows: number;
  updatedRows: number;
  skippedRows: number;
  failedRows: number;
  /** Computed by the BE: created + updated + skipped + failed. Drives the progress bar. */
  processedRows: number;
  startedAt: string | null;
  completedAt: string | null;
  errorSummary: string | null;
  createdAt: string;
  entityCounts: ImportEntityCountDto[];
}

export interface ImportRowDto {
  id: string;
  rowNumber: number;
  entityType: ImportEntityTypeEnum;
  externalRef: string;
  status: ImportRowStatusEnum;
  errors: ErrorEntity[];
  createdEntityId: string | null;
  processedAt: string | null;
  /** Original column values (xlsx column names as keys) — lets the UI pre-fill an edit form. */
  fields: Record<string, string>;
}

export interface ImportBatchListParams {
  pageNumber?: number;
  pageSize?: number;
  status?: ImportBatchStatusEnum;
}

export interface ImportRowListParams {
  pageNumber?: number;
  pageSize?: number;
  status?: ImportRowStatusEnum;
  entityType?: ImportEntityTypeEnum;
}

/** The one .xlsx workbook of an upload — three sheets: Customers, Sites, Battery assets. */
export interface CreateImportBatchPayload {
  file?: File | null;
}

/** One row's corrected field values, keyed by the same column names as the .xlsx sheet. */
export interface ImportRowEditItem {
  rowId: string;
  fields: Record<string, string>;
}

export interface UpdateImportRowsPayload {
  rows: ImportRowEditItem[];
}
