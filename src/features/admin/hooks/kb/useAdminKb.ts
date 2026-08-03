import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminKbService } from "@/features/admin/services/kb/kb.service";
import { QUERY_KEY, KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  KbArticleListParams,
  KbCompareParams,
  CreateKbArticlePayload,
  UpdateKbArticlePayload,
  RejectReviewPayload,
  RollbackPayload,
} from "@/shared/types/kb/kb.types";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";
import { KbArticleStatusEnum } from "@/shared/enums/kb/kb.enum";

export function useAdminKbList(params?: KbArticleListParams) {
  return useQuery({
    queryKey: QUERY_KEY.kb.list(params),
    queryFn: () => adminKbService.getList(params).then((r) => r.data.data),
  });
}

export function useAdminKbDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.detail(id),
    queryFn: () => adminKbService.getDetail(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useAdminKbVersions(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.versions(id),
    queryFn: () => adminKbService.getVersions(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useAdminKbCompare(id: string, params: KbCompareParams | null) {
  return useQuery({
    queryKey: QUERY_KEY.kb.compare(
      id,
      params?.fromVersionId,
      params?.toVersionId,
    ),
    queryFn: () => adminKbService.compare(id, params!).then((r) => r.data.data),
    enabled: !!id && !!params?.fromVersionId,
  });
}

export function useAdminKbSuggest(ticketId?: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.suggest({ ticketId }),
    queryFn: () => adminKbService.suggest(ticketId!).then((r) => r.data.data),
    enabled: !!ticketId,
    staleTime: 30_000,
  });
}

// GET /api/knowledge-base/{id}/usage-stats (Manager/Admin).
export function useAdminKbUsageStats(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.usageStats(id),
    queryFn: () => adminKbService.getUsageStats(id).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

// create/update là form → component xử lý lỗi qua try/catch + setError
export function useCreateKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateKbArticlePayload) =>
      adminKbService.create(payload).then((r) => r.data.data),
    onSuccess: () => {
      toast.success(ADMIN_MESSAGES.kb.created);
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
  });
}

export function useUpdateKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateKbArticlePayload;
    }) => adminKbService.update(id, payload).then((r) => r.data.data),
    onSuccess: (article, { id }) => {
      // BE đưa bài về PendingReview khi thay đổi cần duyệt — nội dung mới chưa hiển thị ngay.
      toast.success(
        article?.status === KbArticleStatusEnum.PendingReview
          ? ADMIN_MESSAGES.kb.updatePending
          : ADMIN_MESSAGES.kb.updated,
      );
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
  });
}

// Sao chép bài KB → tạo bản mới (Draft), trả action DTO có id bản mới.
export function useDuplicateKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      adminKbService.duplicate(id).then((r) => r.data.data),
    onSuccess: () => {
      toast.success(ADMIN_MESSAGES.kb.duplicated);
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useMarkKbHelpful() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminKbService.markHelpful(id),
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
      toast.success(ADMIN_MESSAGES.kb.markedHelpful);
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useDeleteKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminKbService.delete(id),
    onSuccess: () => {
      toast.success(ADMIN_MESSAGES.kb.deleted);
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

// ── Workflow actions (Manager/Admin) — non-form → onError toast ──
function useKbWorkflow<TVars>(
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

export function useApproveKbReview() {
  return useKbWorkflow(
    (id: string) => adminKbService.approveReview(id),
    "Đã phê duyệt và xuất bản",
    (id) => id,
  );
}

export function useRejectKbReview() {
  return useKbWorkflow(
    (vars: { id: string; payload: RejectReviewPayload }) =>
      adminKbService.rejectReview(vars.id, vars.payload),
    "Đã từ chối thay đổi",
    (vars) => vars.id,
  );
}

export function usePublishKbArticle() {
  return useKbWorkflow(
    (id: string) => adminKbService.publish(id),
    "Đã xuất bản bài viết",
    (id) => id,
  );
}

export function useArchiveKbArticle() {
  return useKbWorkflow(
    (id: string) => adminKbService.archive(id),
    "Đã lưu trữ bài viết",
    (id) => id,
  );
}

export function useRollbackKbArticle() {
  return useKbWorkflow(
    (vars: { id: string; payload: RollbackPayload }) =>
      adminKbService.rollback(vars.id, vars.payload),
    "Đã hoàn tác phiên bản",
    (vars) => vars.id,
  );
}
