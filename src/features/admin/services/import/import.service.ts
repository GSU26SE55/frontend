import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type {
  CommonResponse,
  PaginationResponse,
} from "@/shared/types/api.types";
import type {
  CreateImportBatchPayload,
  ImportBatchDto,
  ImportBatchListParams,
  ImportRowDto,
  ImportRowListParams,
  UpdateImportRowsPayload,
} from "@/shared/types/import/import.types";

/** Packs the one workbook into a multipart body under field name "file". */
function toFormData(payload: CreateImportBatchPayload): FormData {
  const form = new FormData();
  if (payload.file) form.append("file", payload.file);
  return form;
}

export const importService = {
  getBatches: (params?: ImportBatchListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<ImportBatchDto>>>(
      ENDPOINTS.IMPORTS.LIST_BATCHES,
      { params },
    ),

  getBatch: (id: string) =>
    axiosInstance.get<CommonResponse<ImportBatchDto>>(
      ENDPOINTS.IMPORTS.BATCH_DETAIL(id),
    ),

  getRows: (id: string, params?: ImportRowListParams) =>
    axiosInstance.get<CommonResponse<PaginationResponse<ImportRowDto>>>(
      ENDPOINTS.IMPORTS.BATCH_ROWS(id),
      { params },
    ),

  /**
   * Uploads the files to be parsed and validated. Returns 201 with the counters; no business
   * data is written yet.
   * 409 means this exact content was uploaded before; 422 means the file is malformed or is
   * missing columns.
   */
  createBatch: (
    payload: CreateImportBatchPayload,
    onUploadProgress?: (percent: number) => void,
  ) =>
    axiosInstance.post<CommonResponse<ImportBatchDto>>(
      ENDPOINTS.IMPORTS.CREATE_BATCH,
      toFormData(payload),
      {
        // Drop the default Content-Type so the browser sets "multipart/form-data" with its
        // boundary. The shared axios instance presets "application/json"; leaving it makes the
        // server answer 415 and read no file at all. Same approach fileStorageService already uses.
        headers: { "Content-Type": undefined },
        onUploadProgress: onUploadProgress
          ? (event) => {
              if (!event.total) return;
              onUploadProgress(Math.round((event.loaded / event.total) * 100));
            }
          : undefined,
      },
    ),

  /**
   * Corrects one or more invalid rows in place and re-validates the WHOLE batch — fixing a
   * customer row can clear a "customer not found" error on a site row nobody touched, so the
   * server always re-checks everything, not just the edited rows.
   */
  updateRows: (id: string, payload: UpdateImportRowsPayload) =>
    axiosInstance.put<CommonResponse<ImportBatchDto>>(
      ENDPOINTS.IMPORTS.UPDATE_ROWS(id),
      payload,
    ),

  /** Returns 202 and exits at once — the background worker does the writing. The screen has to
   *  poll for progress. */
  commitBatch: (id: string) =>
    axiosInstance.post<CommonResponse<ImportBatchDto>>(
      ENDPOINTS.IMPORTS.COMMIT_BATCH(id),
    ),

  revertBatch: (id: string) =>
    axiosInstance.post<CommonResponse<ImportBatchDto>>(
      ENDPOINTS.IMPORTS.REVERT_BATCH(id),
    ),

  /**
   * Downloads the template (.xlsx) and the error report (.csv).
   *
   * Uses `responseType: "blob"` because these two endpoints return a file rather than the JSON
   * envelope the rest of the system uses. On the default, axios tries to parse it as JSON and the
   * file content is corrupted.
   */
  downloadTemplate: () =>
    axiosInstance.get<Blob>(ENDPOINTS.IMPORTS.TEMPLATE, {
      responseType: "blob",
    }),

  downloadErrorsCsv: (id: string) =>
    axiosInstance.get<Blob>(ENDPOINTS.IMPORTS.BATCH_ERRORS_CSV(id), {
      responseType: "blob",
    }),
};
