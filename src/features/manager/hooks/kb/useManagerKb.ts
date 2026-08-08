import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { managerKbService } from "@/features/manager/services/kb/kb.service";
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
import { MANAGER_MESSAGES } from "@/features/manager/constants/messages";
import { KbArticleStatusEnum } from "@/shared/enums/kb/kb.enum";

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

// create/update are forms → the component handles errors via try/catch + setError
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
    onSuccess: (article, { id }) => {
      // The BE moves the article back to PendingReview when a change needs approval — the new content isn't live yet.
      toast.success(
        article?.status === KbArticleStatusEnum.PendingReview
          ? MANAGER_MESSAGES.kb.updatePending
          : MANAGER_MESSAGES.kb.updated,
      );
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
  });
}

// Copy a KB article → create a new one (Draft), returns an action DTO holding the new id.
export function useManagerDuplicateKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      managerKbService.duplicate(id).then((r) => r.data.data),
    onSuccess: () => {
      toast.success(MANAGER_MESSAGES.kb.duplicated);
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
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
    "Approved and published",
    (id) => id,
  );
}

export function useManagerRejectKbReview() {
  return useManagerKbWorkflow(
    (vars: { id: string; payload: RejectReviewPayload }) =>
      managerKbService.rejectReview(vars.id, vars.payload),
    "Changes rejected",
    (vars) => vars.id,
  );
}

export function useManagerPublishKbArticle() {
  return useManagerKbWorkflow(
    (id: string) => managerKbService.publish(id),
    "Article published",
    (id) => id,
  );
}

export function useManagerArchiveKbArticle() {
  return useManagerKbWorkflow(
    (id: string) => managerKbService.archive(id),
    "Article archived",
    (id) => id,
  );
}

export function useManagerRollbackKbArticle() {
  return useManagerKbWorkflow(
    (vars: { id: string; payload: RollbackPayload }) =>
      managerKbService.rollback(vars.id, vars.payload),
    "Version rolled back",
    (vars) => vars.id,
  );
}
