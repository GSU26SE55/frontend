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
} from "@/shared/types/import/import.types";
import type { ImportEntityTypeEnum } from "@/shared/enums/import/import.enum";

/**
 * Gói ba file thành một body multipart.
 *
 * Chỉ đính kèm phần nào thực sự được chọn: gửi một trường rỗng khiến phía máy chủ nhận một file
 * dài 0 byte và báo "file rỗng" thay vì hiểu là người dùng không nạp loại dữ liệu đó.
 */
function toFormData(payload: CreateImportBatchPayload): FormData {
  const form = new FormData();
  if (payload.customersFile) form.append("customersFile", payload.customersFile);
  if (payload.sitesFile) form.append("sitesFile", payload.sitesFile);
  if (payload.assetsFile) form.append("assetsFile", payload.assetsFile);
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
   * Gửi file lên để đọc và kiểm định. Trả 201 kèm bộ đếm; chưa ghi dữ liệu nghiệp vụ nào.
   * 409 nghĩa là đúng nội dung này đã nạp trước đó; 422 nghĩa là file hỏng hoặc thiếu cột.
   */
  createBatch: (payload: CreateImportBatchPayload) =>
    axiosInstance.post<CommonResponse<ImportBatchDto>>(
      ENDPOINTS.IMPORTS.CREATE_BATCH,
      toFormData(payload),
      // Gỡ Content-Type mặc định để trình duyệt tự đặt "multipart/form-data" kèm chuỗi ngăn cách.
      // Instance axios dùng chung đặt sẵn "application/json"; giữ nguyên thì máy chủ trả 415 và
      // không đọc được file nào. Cùng cách mà fileStorageService đang làm.
      { headers: { "Content-Type": undefined } },
    ),

  /** Trả 202 rồi thoát ngay — tiến trình nền mới là nơi ghi thật. Màn hình phải hỏi lại tiến độ. */
  commitBatch: (id: string) =>
    axiosInstance.post<CommonResponse<ImportBatchDto>>(
      ENDPOINTS.IMPORTS.COMMIT_BATCH(id),
    ),

  revertBatch: (id: string) =>
    axiosInstance.post<CommonResponse<ImportBatchDto>>(
      ENDPOINTS.IMPORTS.REVERT_BATCH(id),
    ),

  /**
   * Tải file mẫu và file lỗi.
   *
   * Dùng `responseType: "blob"` vì hai endpoint này trả CSV, không trả bọc JSON như phần còn lại
   * của hệ thống. Để mặc định thì axios cố đọc thành JSON và nội dung file bị hỏng.
   */
  downloadTemplate: (entityType: ImportEntityTypeEnum) =>
    axiosInstance.get<Blob>(ENDPOINTS.IMPORTS.TEMPLATE(entityType), {
      responseType: "blob",
    }),

  downloadErrorsCsv: (id: string) =>
    axiosInstance.get<Blob>(ENDPOINTS.IMPORTS.BATCH_ERRORS_CSV(id), {
      responseType: "blob",
    }),
};
