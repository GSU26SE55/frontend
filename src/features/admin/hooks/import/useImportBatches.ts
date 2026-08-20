import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { importService } from "@/features/admin/services/import/import.service";
import {
  isImportBatchRunning,
  type ImportEntityTypeEnum,
} from "@/shared/enums/import/import.enum";
import type {
  CreateImportBatchPayload,
  ImportBatchListParams,
  ImportRowListParams,
} from "@/shared/types/import/import.types";

/**
 * Nhịp hỏi lại khi lô đang chạy.
 *
 * Lô đi qua message bus để xin tài khoản khách hàng nên có quãng chờ thật; 2 giây đủ để thanh
 * tiến độ nhích trông tự nhiên mà không dội quá nhiều request lên máy chủ.
 */
const RUNNING_POLL_MS = 2_000;

export function useImportBatches(params?: ImportBatchListParams) {
  return useQuery({
    queryKey: QUERY_KEY.importBatches.list(params),
    queryFn: () => importService.getBatches(params).then((r) => r.data.data),
    // Dừng hỏi lại ngay khi không còn lô nào đang chạy — danh sách lô cũ là dữ liệu tĩnh.
    refetchInterval: (query) =>
      query.state.data?.items.some((batch) => isImportBatchRunning(batch.status))
        ? RUNNING_POLL_MS
        : false,
  });
}

export function useImportBatch(id: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEY.importBatches.detail(id),
    queryFn: () => importService.getBatch(id).then((r) => r.data.data),
    enabled: enabled && !!id,
    refetchInterval: (query) =>
      query.state.data && isImportBatchRunning(query.state.data.status)
        ? RUNNING_POLL_MS
        : false,
  });
}

export function useImportRows(
  batchId: string,
  params?: ImportRowListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: QUERY_KEY.importBatches.rows(batchId, params),
    queryFn: () => importService.getRows(batchId, params).then((r) => r.data.data),
    enabled: enabled && !!batchId,
  });
}

export function useCreateImportBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateImportBatchPayload) =>
      importService.createBatch(payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.importBatches] });
    },
  });
}

export function useCommitImportBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      importService.commitBatch(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.importBatches] });
    },
  });
}

export function useRevertImportBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      importService.revertBatch(id).then((r) => r.data),
    onSuccess: () => {
      // Hoàn tác gỡ site, pin và thiết bị nên ba danh sách kia cũng cũ theo.
      qc.invalidateQueries({ queryKey: [KEY.importBatches] });
      qc.invalidateQueries({ queryKey: [KEY.sites] });
      qc.invalidateQueries({ queryKey: [KEY.batteryAssets] });
      qc.invalidateQueries({ queryKey: [KEY.iotDevices] });
    },
  });
}

/**
 * Tải một file do máy chủ sinh ra.
 *
 * Tự tạo thẻ neo rồi bấm thay vì mở thẳng đường dẫn: hai endpoint này cần thẻ xác thực trong tiêu
 * đề, mà điều hướng cả trang thì trình duyệt không gửi tiêu đề đó đi.
 */
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useDownloadImportTemplate() {
  return useMutation({
    mutationFn: async (entityType: ImportEntityTypeEnum) => {
      const response = await importService.downloadTemplate(entityType);
      saveBlob(response.data, `import-template-${entityType}.csv`);
    },
  });
}

export function useDownloadImportErrors() {
  return useMutation({
    mutationFn: async (batchId: string) => {
      const response = await importService.downloadErrorsCsv(batchId);
      saveBlob(response.data, `import-errors-${batchId}.csv`);
    },
  });
}
