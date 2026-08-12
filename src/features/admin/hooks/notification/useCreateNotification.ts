import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminNotificationService } from "@/features/admin/services/notification/notification.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type { CreateNotificationPayload } from "@/features/admin/types/notification/notification.types";
import type { UpdatePushTransportCommand } from "@/shared/types/notification/notification.types";
import { toast } from "sonner";

export const useCreateNotification = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNotificationPayload) =>
      adminNotificationService.create(payload),
    onSuccess: () => {
      // Every mutation must invalidate the feature's root key — badge + feed refetch
      // immediately instead of waiting for the 30s polling cycle.
      qc.invalidateQueries({ queryKey: [KEY.notifications] });
    },
  });
};

export const useAdminPushTransport = () =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationSettings.pushTransport(),
    queryFn: () =>
      adminNotificationService.getPushTransport().then((r) => r.data.data),
  });

export const useAdminUpdatePushTransport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (command: UpdatePushTransportCommand) =>
      adminNotificationService
        .updatePushTransport(command)
        .then((r) => r.data.data),
    onSuccess: (data) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEY.admin.notificationSettings.pushTransport(),
      });
      toast.success(
        `System-wide push transport updated to ${data?.transportName || "new value"}`,
      );
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
