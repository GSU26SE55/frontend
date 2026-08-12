import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { staffKbService } from "@/features/staff/services/kb/kb.service";
import { QUERY_KEY, KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  KbArticleListParams,
  KbCompareParams,
  CreateKbArticlePayload,
  UpdateKbArticlePayload,
} from "@/shared/types/kb/kb.types";
import { STAFF_MESSAGES } from "@/features/staff/constants/messages";
import { KbArticleStatusEnum } from "@/shared/enums/kb/kb.enum";

export function useStaffKbList(params?: KbArticleListParams) {
  return useQuery({
    queryKey: QUERY_KEY.kb.list(params),
    queryFn: () => staffKbService.getList(params).then((r) => r.data.data),
  });
}

export function useStaffKbDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.detail(id),
    queryFn: () => staffKbService.getDetail(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useStaffKbVersions(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.versions(id),
    queryFn: () => staffKbService.getVersions(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useStaffKbCompare(id: string, params: KbCompareParams | null) {
  return useQuery({
    queryKey: QUERY_KEY.kb.compare(
      id,
      params?.fromVersionId,
      params?.toVersionId,
    ),
    queryFn: () => staffKbService.compare(id, params!).then((r) => r.data.data),
    enabled: !!id && !!params?.fromVersionId,
  });
}

export function useStaffKbSuggest(ticketId?: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.suggest({ ticketId }),
    queryFn: () => staffKbService.suggest(ticketId!).then((r) => r.data.data),
    enabled: !!ticketId,
    staleTime: 30_000,
  });
}

// create/update are form submits → the component handles errors via try/catch + setError (no onError on the hook)
export function useStaffKbCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateKbArticlePayload) =>
      staffKbService.create(payload).then((r) => r.data.data),
    onSuccess: () => {
      toast.success(STAFF_MESSAGES.kb.created);
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
  });
}

export function useStaffKbUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateKbArticlePayload;
    }) => staffKbService.update(id, payload).then((r) => r.data.data),
    onSuccess: (article, { id }) => {
      // Staff editing their own article goes live immediately; editing someone else's needs approval first.
      toast.success(
        article?.status === KbArticleStatusEnum.PendingReview
          ? STAFF_MESSAGES.kb.updatePending
          : STAFF_MESSAGES.kb.updated,
      );
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
  });
}

// Duplicate a KB article → creates a new one (Draft) and returns an action DTO with the new id.
export function useStaffDuplicateKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      staffKbService.duplicate(id).then((r) => r.data.data),
    onSuccess: () => {
      toast.success(STAFF_MESSAGES.kb.duplicated);
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useMarkStaffKbHelpful() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffKbService.markHelpful(id),
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
      toast.success(STAFF_MESSAGES.kb.markedHelpful);
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
