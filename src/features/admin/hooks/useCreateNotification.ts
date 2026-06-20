import { useMutation } from "@tanstack/react-query";
import { adminNotificationService } from "@/features/admin/services/notification.service";
import type { CreateNotificationPayload } from "@/features/admin/types/notification.types";

// Target user khác admin hiện tại → không invalidate list nào của chính mình.
export const useCreateNotification = () =>
  useMutation({
    mutationFn: (payload: CreateNotificationPayload) =>
      adminNotificationService.create(payload),
  });
