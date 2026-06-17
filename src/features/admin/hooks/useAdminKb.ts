import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminKbService } from "../services/kb.service";
import { QUERY_KEY, KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  KbArticleListParams,
  CreateKbArticlePayload,
  UpdateKbArticlePayload,
} from "@/shared/types/kb.types";

export function useAdminKbList(params?: KbArticleListParams) {
  return useQuery({
    queryKey: QUERY_KEY.kb.list(params),
    queryFn: () => adminKbService.getList(params),
    select: (res) => res.data,
  });
}

export function useAdminKbDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.detail(id),
    queryFn: () => adminKbService.getDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateKbArticlePayload) =>
      adminKbService.create(payload),
    onSuccess: () => {
      toast.success("Đã tạo bài viết KB");
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
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
    }) => adminKbService.update(id, payload),
    onSuccess: (_, { id }) => {
      toast.success("Đã cập nhật bài viết");
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
      toast.success("Đã xóa bài viết");
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function usePublishKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminKbService.publish(id),
    onSuccess: (_, id) => {
      toast.success("Đã xuất bản bài viết");
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useArchiveKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminKbService.archive(id),
    onSuccess: (_, id) => {
      toast.success("Đã lưu trữ bài viết");
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
