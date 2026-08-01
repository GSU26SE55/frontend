import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminNotificationService } from "@/features/admin/services/notification/notification.service";
import { KEY } from "@/shared/utils/queryKeys";
import type { CreateNotificationPayload } from "@/features/admin/types/notification/notification.types";

export const useCreateNotification = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNotificationPayload) =>
      adminNotificationService.create(payload),
    onSuccess: () => {
      // Mọi mutation phải invalidate key gốc của feature — badge + feed refetch
      // ngay, không đợi nhịp polling 30s.
      qc.invalidateQueries({ queryKey: [KEY.notifications] });
    },
  });
};
