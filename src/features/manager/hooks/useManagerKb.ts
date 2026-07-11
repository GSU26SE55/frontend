import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { managerKbService } from "../services/kb.service";
import { QUERY_KEY, KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  KbArticleListParams,
  KbCompareParams,
  CreateKbArticlePayload,
  UpdateKbArticlePayload,
  RejectReviewPayload,
  RollbackPayload,
} from "@/shared/types/kb.types";
import { MANAGER_MESSAGES } from "@/features/manager/constants/messages";

export function useManagerKbList(params?: KbArticleListParams) {
  return useQuery({
    queryKey: QUERY_KEY.kb.list(params),
    queryFn: () => managerKbService.getList(params).then((r) => r.data.data),
  });
}

export function useManagerKbDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.detail(id),
    queryFn: () => managerKbService.getDetail(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useManagerKbVersions(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.versions(id),
    queryFn: () => managerKbService.getVersions(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useManagerKbVersionDetail(
  id: string,
  versionId: string | null,
) {
  return useQuery({
    queryKey: QUERY_KEY.kb.versionDetail(id, versionId),
    queryFn: () =>
      managerKbService.getVersionById(id, versionId!).then((r) => r.data.data),
    enabled: !!id && !!versionId,
  });
}

export function useManagerKbCompare(
  id: string,
  params: KbCompareParams | null,
) {
  return useQuery({
    queryKey: QUERY_KEY.kb.compare(
      id,
      params?.fromVersionId,
      params?.toVersionId,
    ),
    queryFn: () =>
      managerKbService.compare(id, params!).then((r) => r.data.data),
    enabled: !!id && !!params?.fromVersionId,
  });
}

export function useManagerKbSuggest(ticketId?: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.suggest({ ticketId }),
    queryFn: () => managerKbService.suggest(ticketId!).then((r) => r.data.data),
    enabled: !!ticketId,
    staleTime: 30_000,
  });
}

// create/update là form → component xử lý lỗi qua try/catch + setError
export function useManagerCreateKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateKbArticlePayload) =>
      managerKbService.create(payload).then((r) => r.data.data),
    onSuccess: () => {
      toast.success(MANAGER_MESSAGES.kb.created);
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
  });
}

export function useManagerUpdateKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateKbArticlePayload;
    }) => managerKbService.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      toast.success(MANAGER_MESSAGES.kb.updated);
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
  });
}

export function useManagerCopyKbTemplate() {
  return useMutation({
    mutationFn: (id: string) =>
      managerKbService.copyTemplate(id).then((r) => r.data.data),
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useMarkManagerKbHelpful() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => managerKbService.markHelpful(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [KEY.kb] });
      qc.setQueriesData<{ items: { id: string; helpfulCount: number }[] }>(
        { queryKey: [KEY.kb], type: "active" },
        (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === id
                ? { ...item, helpfulCount: item.helpfulCount + 1 }
                : item,
            ),
          };
        },
      );
    },
    onSuccess: (_, id) => {
      toast.success(MANAGER_MESSAGES.kb.markedHelpful);
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

// ── Workflow actions (Manager/Admin) — non-form → onError toast ──
function useManagerKbWorkflow<TVars>(
  fn: (vars: TVars) => Promise<unknown>,
  successMsg: string,
  idOf: (vars: TVars) => string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_, vars) => {
      toast.success(successMsg);
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(idOf(vars)) });
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.versions(idOf(vars)) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useManagerApproveKbReview() {
  return useManagerKbWorkflow(
    (id: string) => managerKbService.approveReview(id),
    "Đã phê duyệt và xuất bản",
    (id) => id,
  );
}

export function useManagerRejectKbReview() {
  return useManagerKbWorkflow(
    (vars: { id: string; payload: RejectReviewPayload }) =>
      managerKbService.rejectReview(vars.id, vars.payload),
    "Đã từ chối thay đổi",
    (vars) => vars.id,
  );
}

export function useManagerPublishKbArticle() {
  return useManagerKbWorkflow(
    (id: string) => managerKbService.publish(id),
    "Đã xuất bản bài viết",
    (id) => id,
  );
}

export function useManagerArchiveKbArticle() {
  return useManagerKbWorkflow(
    (id: string) => managerKbService.archive(id),
    "Đã lưu trữ bài viết",
    (id) => id,
  );
}

export function useManagerRollbackKbArticle() {
  return useManagerKbWorkflow(
    (vars: { id: string; payload: RollbackPayload }) =>
      managerKbService.rollback(vars.id, vars.payload),
    "Đã hoàn tác phiên bản",
    (vars) => vars.id,
  );
}
