import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { managerKbService } from "../services/kb.service";
import { QUERY_KEY, KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  KbArticleListParams,
  CreateKbArticlePayload,
  UpdateKbArticlePayload,
} from "@/shared/types/kb.types";

export function useManagerKbList(params?: KbArticleListParams) {
  return useQuery({
    queryKey: QUERY_KEY.kb.list(params),
    queryFn: () => managerKbService.getList(params),
    select: (res) => res.data,
  });
}

export function useManagerKbDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.detail(id),
    queryFn: () => managerKbService.getDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useManagerCreateKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateKbArticlePayload) =>
      managerKbService.create(payload),
    onSuccess: () => {
      toast.success("Đã tạo bài viết KB");
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
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
    }) => managerKbService.update(id, payload),
    onSuccess: (_, { id }) => {
      toast.success("Đã cập nhật bài viết");
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useManagerDeleteKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => managerKbService.delete(id),
    onSuccess: () => {
      toast.success("Đã xóa bài viết");
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useManagerPublishKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => managerKbService.publish(id),
    onSuccess: (_, id) => {
      toast.success("Đã xuất bản bài viết");
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useManagerArchiveKbArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => managerKbService.archive(id),
    onSuccess: (_, id) => {
      toast.success("Đã lưu trữ bài viết");
      qc.invalidateQueries({ queryKey: QUERY_KEY.kb.detail(id) });
      qc.invalidateQueries({ queryKey: [KEY.kb] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
