import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationMatrixService } from "@/shared/services/notification/notification-matrix.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { UpdateNotificationMatrixPayload } from "@/shared/types/notification/notification-matrix.types";

// Group × channel matrix for the current user. Same cache cadence as preferences (5 min).
export const useNotificationMatrix = () =>
  useQuery({
    queryKey: QUERY_KEY.notificationPreferences.matrix(),
    queryFn: () =>
      notificationMatrixService.getMatrix().then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

// Type → group lookup table. Nearly static (only changes when BE adds a NotificationType).
export const useNotificationCategories = () =>
  useQuery({
    queryKey: QUERY_KEY.notificationPreferences.categories(),
    queryFn: () =>
      notificationMatrixService.getCategories().then((r) => r.data.data ?? []),
    staleTime: 30 * 60_000,
  });

// PUT returns the full matrix after the update → set it straight into the cache, skip the extra refetch.
export const useUpdateNotificationMatrix = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateNotificationMatrixPayload) =>
      notificationMatrixService.updateMatrix(payload),
    onSuccess: (res) => {
      const matrix = res.data.data;
      if (matrix) {
        qc.setQueryData(QUERY_KEY.notificationPreferences.matrix(), matrix);
      } else {
        qc.invalidateQueries({
          queryKey: QUERY_KEY.notificationPreferences.matrix(),
        });
      }
    },
  });
};
