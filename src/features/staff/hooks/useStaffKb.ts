import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { staffKbService } from "../services/kb.service";
import { QUERY_KEY, KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  KbArticleListParams,
  KbCompareParams,
  CreateKbArticlePayload,
  UpdateKbArticlePayload,
} from "@/shared/types/kb.types";

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

// create/update là form → component xử lý lỗi qua try/catch + setError (không onError ở hook)
export function useStaffKbCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateKbArticlePayload) =>
      staffKbService.create(payload).then((r) => r.data.data),
    onSuccess: () => {
      toast.success("Đã tạo bài viết KB (chờ duyệt)");
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
    onSuccess: (_, { id }) => {
      toast.success("Đã cập nhật bài viết (chờ duyệt)");
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
  });
}

export function useStaffKbCopyTemplate() {
  return useMutation({
    mutationFn: (id: string) =>
      staffKbService.copyTemplate(id).then((r) => r.data.data),
    onError: (error) => handleErrorApi({ error }),
  });
}
