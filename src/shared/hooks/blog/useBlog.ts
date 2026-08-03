import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { blogService } from "@/shared/services/blog/blog.service";
import { QUERY_KEY, KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  BlogPostStatusEnum,
  BLOG_GENERATION_TERMINAL_STATUSES,
} from "@/shared/enums/blog/blog.enum";
import type {
  BlogPostListParams,
  BlogTemplateListParams,
  BlogCompareParams,
  CreateBlogPostPayload,
  UpdateBlogPostPayload,
} from "@/shared/types/blog/blog.types";

/** Số lần poll tối đa khi chờ AI sinh bài (~2 phút với interval 3s). */
const GENERATION_POLL_LIMIT = 40;
const GENERATION_POLL_INTERVAL = 3000;

// ── Read: public (chỉ bài Published) ──

export function useBlogPublicList(params?: BlogPostListParams) {
  return useQuery({
    queryKey: QUERY_KEY.blog.publicList(params),
    queryFn: () => blogService.getPublicList(params).then((r) => r.data.data),
  });
}

export function useBlogPublicDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.blog.publicDetail(id),
    queryFn: () => blogService.getPublicDetail(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

// ── Read: internal (mọi trạng thái) ──

export function useBlogList(params?: BlogPostListParams) {
  return useQuery({
    queryKey: QUERY_KEY.blog.list(params),
    queryFn: () => blogService.getList(params).then((r) => r.data.data),
  });
}

export function useBlogDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.blog.detail(id),
    queryFn: () => blogService.getDetail(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

/**
 * Poll bài đang được AI sinh cho tới khi đạt trạng thái kết thúc
 * (`Draft` = xong, `GenerationFailed` = lỗi), hoặc quá `GENERATION_POLL_LIMIT` lần.
 *
 * Dùng endpoint internal — public detail trả 404 khi bài chưa Published.
 */
export function useBlogGenerationStatus(id: string, enabled: boolean) {
  // Đếm cục bộ, KHÔNG dùng query.state.dataUpdateCount: hook này chia sẻ
  // queryKey với useBlogDetail nên dataUpdateCount tính cả lần fetch của
  // trang chi tiết → poll có thể dừng sớm hơn giới hạn (thậm chí ngay lần đầu).
  const pollCount = useRef(0);

  useEffect(() => {
    if (enabled) pollCount.current = 0;
  }, [enabled, id]);

  return useQuery({
    queryKey: QUERY_KEY.blog.detail(id),
    queryFn: () => blogService.getDetail(id).then((r) => r.data.data),
    enabled: enabled && !!id,
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Dừng khi đã xong/thất bại
      if (status && BLOG_GENERATION_TERMINAL_STATUSES.includes(status))
        return false;
      // Dừng khi quá hạn chờ — tránh poll vô hạn nếu worker treo
      if (pollCount.current >= GENERATION_POLL_LIMIT) return false;
      pollCount.current += 1;
      return GENERATION_POLL_INTERVAL;
    },
  });
}

export function useBlogVersions(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.blog.versions(id),
    queryFn: () => blogService.getVersions(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useBlogCompare(id: string, params: BlogCompareParams | null) {
  return useQuery({
    queryKey: QUERY_KEY.blog.compare(
      id,
      params?.oldVersionNumber,
      params?.newVersionNumber,
    ),
    queryFn: () => blogService.compare(id, params!).then((r) => r.data.data),
    enabled: !!id && !!params,
  });
}

// ── Read: blog templates (Staff+) ──

export function useBlogTemplates(params?: BlogTemplateListParams) {
  return useQuery({
    queryKey: QUERY_KEY.blogTemplates.list(params),
    queryFn: () => blogService.getTemplates(params).then((r) => r.data.data),
  });
}

// ── Write: soạn thảo (Staff+) ──
// Form dùng mutateAsync + try/catch + handleErrorApi({ error, setError }) ở component.

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBlogPostPayload) =>
      blogService.create(payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.blog] });
      toast.success("Đã tạo bài viết");
    },
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBlogPostPayload;
    }) => blogService.update(id, payload).then((r) => r.data.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [KEY.blog] });
      qc.invalidateQueries({ queryKey: QUERY_KEY.blog.versions(vars.id) });
      toast.success("Đã cập nhật bài viết");
    },
  });
}

// ── Write: workflow (Manager/Admin) ──
// Không có form → dùng onError để toast trực tiếp.

export function useGenerateBlogFromKb() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kbId: string) =>
      blogService.generateFromKb(kbId).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.blog] });
      toast.success("Đã gửi yêu cầu tạo blog bằng AI");
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function usePublishBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      blogService.publish(id).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.blog] });
      toast.success("Đã xuất bản");
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useArchiveBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      blogService.archive(id).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.blog] });
      toast.success("Đã lưu trữ");
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => blogService.remove(id).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.blog] });
      toast.success("Đã xóa bài viết");
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

/** Bài ở trạng thái này thì BE chặn PUT (409) → UI disable nút Sửa. */
export function isBlogEditable(status?: BlogPostStatusEnum) {
  if (!status) return false;
  return (
    status !== BlogPostStatusEnum.Generating &&
    status !== BlogPostStatusEnum.Archived
  );
}
