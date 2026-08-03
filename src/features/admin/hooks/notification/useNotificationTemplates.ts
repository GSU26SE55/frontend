import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationTemplateService } from "@/features/admin/services/notification/notification-template.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  NotificationTemplateListParams,
  CreateNotificationTemplatePayload,
  ReviseNotificationTemplatePayload,
  TemplateSampleDataPayload,
} from "@/features/admin/types/notification/notification-template.types";

// Template gần như tĩnh (chỉ đổi khi seed lại hoặc admin soạn) → cache 5 phút.
// Trả nguyên khối phân trang của BE (items + totalItems + totalPages + hasNext/Prev) — page cần
// đủ các trường này cho DataPagination, không tự suy ra từ độ dài mảng được.
export const useNotificationTemplates = (
  params?: NotificationTemplateListParams,
) =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationTemplates.list(params),
    queryFn: () =>
      notificationTemplateService.getList(params).then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

// Hợp đồng tên biến là dữ liệu TĨNH suy ra từ code backend — không đổi trong một phiên làm việc,
// nên cache thẳng `Infinity` thay vì đặt một con số phút tuỳ tiện. Đổi được nó chỉ có deploy mới.
export const useTemplateVariables = () =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationTemplates.variables(),
    queryFn: () =>
      notificationTemplateService.getVariables().then((r) => r.data.data),
    staleTime: Infinity,
    gcTime: Infinity,
  });

// Ngược lại, độ phủ đọc từ dữ liệu thật (số thông báo đã sinh + template đang bật) nên phải hết
// hạn nhanh và được invalidate sau mỗi lần soạn template.
export const useTemplateCoverage = () =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationTemplates.coverage(),
    queryFn: () =>
      notificationTemplateService.getCoverage().then((r) => r.data.data),
    staleTime: 60_000,
  });

// Preview không đổi state server → mutation (không cache), lỗi cú pháp Handlebars
// trả 400 và được hiển thị ngay trong dialog thay vì toast trôi mất.
export const usePreviewTemplate = () =>
  useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: TemplateSampleDataPayload;
    }) => notificationTemplateService.preview(id, payload).then((r) => r.data),
  });

export const useTestSendTemplate = () =>
  useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: TemplateSampleDataPayload;
    }) => notificationTemplateService.testSend(id, payload).then((r) => r.data),
    onSuccess: (res) => {
      // message BE: "Đã gửi thử tới {email}." — hiện nguyên văn để admin biết địa chỉ nhận.
      const remaining = res.data?.remainingThisHour;
      toast.success(
        res.message ?? "Đã gửi thử",
        remaining !== undefined
          ? { description: `Còn ${remaining} lượt trong giờ này` }
          : undefined,
      );
    },
    onError: (error) => handleErrorApi({ error }),
  });

export const useActivateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      notificationTemplateService.activate(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationTemplates });
      toast.success(res.message ?? "Đã kích hoạt phiên bản");
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

// Tạo/sửa dùng trong form ⇒ KHÔNG đặt onError ở đây: component gọi mutateAsync trong try-catch rồi
// handleErrorApi({ error, setError }) để lỗi từng trường hiện dưới đúng ô nhập. Đặt onError ở hook
// sẽ nuốt mất lỗi vào toast và ô nhập không bao giờ đỏ.
export const useCreateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNotificationTemplatePayload) =>
      notificationTemplateService.create(payload).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationTemplates });
      toast.success(res.message ?? "Đã tạo mẫu thông báo");
    },
  });
};

export const useReviseTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ReviseNotificationTemplatePayload;
    }) => notificationTemplateService.revise(id, payload).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationTemplates });
      toast.success(res.message ?? "Đã tạo phiên bản mới");
    },
  });
};

// Xoá không có form ⇒ dùng onError để bắn toast trực tiếp (BE trả 409 khi xoá bản đang dùng).
export const useDeleteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      notificationTemplateService.remove(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationTemplates });
      toast.success(res.message ?? "Đã xoá phiên bản");
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
