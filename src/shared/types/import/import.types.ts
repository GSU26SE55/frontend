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

/** The three CSV files of one upload. All optional, but at least one must be present. */
export interface CreateImportBatchPayload {
  customersFile?: File | null;
  sitesFile?: File | null;
  assetsFile?: File | null;
}

