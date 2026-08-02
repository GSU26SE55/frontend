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
      // Invalidate key gốc feature — đổi channel toàn cục ảnh hưởng cả matrix
      // (nhóm isCustomized=false kế thừa từ channels), không chỉ riêng .me().
      qc.invalidateQueries({ queryKey: [KEY.notificationPreferences] });
    },
  });
};
