import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { importService } from "@/features/admin/services/import/import.service";
import { isImportBatchRunning } from "@/shared/enums/import/import.enum";
import type {
  CreateImportBatchPayload,
  ImportBatchListParams,
  ImportRowListParams,
  UpdateImportRowsPayload,
} from "@/shared/types/import/import.types";

/**
 * Poll interval while a batch is running.
 *
 * A batch goes through the message bus to request customer accounts, so there is a real wait;
 * 2 seconds is enough for the progress bar to move naturally without flooding the server.
 */
const RUNNING_POLL_MS = 2_000;

export function useImportBatches(params?: ImportBatchListParams) {
  return useQuery({
    queryKey: QUERY_KEY.importBatches.list(params),
    queryFn: () => importService.getBatches(params).then((r) => r.data.data),
    // Stop polling as soon as no batch is running — the list of old batches is static data.
    refetchInterval: (query) =>
      query.state.data?.items.some((batch) =>
        isImportBatchRunning(batch.status),
      )
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
    queryFn: () =>
      importService.getRows(batchId, params).then((r) => r.data.data),
    enabled: enabled && !!batchId,
  });
}

export function useCreateImportBatch(
  onUploadProgress?: (percent: number) => void,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateImportBatchPayload) =>
      importService.createBatch(payload, onUploadProgress).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.importBatches] });
    },
  });
}

export function useUpdateImportRows(batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateImportRowsPayload) =>
      importService.updateRows(batchId, payload).then((r) => r.data),
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
      // A revert removes sites, battery assets and devices, so those three lists go stale too.
      qc.invalidateQueries({ queryKey: [KEY.importBatches] });
      qc.invalidateQueries({ queryKey: [KEY.sites] });
      qc.invalidateQueries({ queryKey: [KEY.batteryAssets] });
      qc.invalidateQueries({ queryKey: [KEY.iotDevices] });
    },
  });
}

/**
 * Downloads a server-generated file.
 *
 * Builds an anchor and clicks it rather than navigating to the URL: these two endpoints need the
 * auth token in a header, and a full-page navigation would not send that header.
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
    mutationFn: async () => {
      const response = await importService.downloadTemplate();
      saveBlob(response.data, "import-template.xlsx");
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
