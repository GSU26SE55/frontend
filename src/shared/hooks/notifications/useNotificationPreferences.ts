import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationPreferenceService } from "@/shared/services/notification/notification-preference.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
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
      // Invalidate the feature's root key — changing a channel globally affects the matrix too
      // (groups with isCustomized=false inherit from channels), not just .me().
      qc.invalidateQueries({ queryKey: [KEY.notificationPreferences] });
    },
  });
};
