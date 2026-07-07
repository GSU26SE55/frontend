import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/shared/services/notification.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type { NotificationsParams } from "@/shared/types/notification.types";

// List notification cho dropdown bell. `enabled` để chỉ fetch khi dropdown mở.
export const useNotifications = (
  params: NotificationsParams,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEY.notifications.list(params),
    queryFn: () =>
      notificationService.getList(params).then((r) => r.data.data),
    staleTime: 30_000,
    enabled,
  });

// Badge số chưa đọc — auto refetch 30s.
export const useUnreadCount = () =>
  useQuery({
    queryKey: QUERY_KEY.notifications.unreadCount(),
    queryFn: () =>
      notificationService.getUnreadCount().then((r) => r.data.data ?? 0),
    staleTime: 0,
    refetchInterval: 30_000,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.notifications] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.notifications] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
