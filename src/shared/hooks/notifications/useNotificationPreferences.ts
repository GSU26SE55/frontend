import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationPreferenceService } from "@/shared/services/notification/notification-preference.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { UpdateNotificationPreferencePayload } from "@/shared/types/notification/notification-preference.types";

export const useNotificationPreferences = () =>
  useQuery({
    queryKey: QUERY_KEY.notificationPreferences.me(),
    queryFn: () => notificationPreferenceService.get().then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

export const useUpdateNotificationPreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateNotificationPreferencePayload) =>
      notificationPreferenceService.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QUERY_KEY.notificationPreferences.me(),
      });
    },
  });
};
