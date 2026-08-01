import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationTemplateService } from "@/features/admin/services/notification/notification-template.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  NotificationTemplateListParams,
  TemplateSampleDataPayload,
} from "@/features/admin/types/notification/notification-template.types";

// Template gần như tĩnh (chỉ đổi khi seed lại hoặc activate bản khác) → cache 5 phút.
export const useNotificationTemplates = (
  params?: NotificationTemplateListParams,
) =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationTemplates.list(params),
    queryFn: () =>
      notificationTemplateService
        .getList(params)
        .then((r) => r.data.data ?? []),
    staleTime: 5 * 60_000,
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
