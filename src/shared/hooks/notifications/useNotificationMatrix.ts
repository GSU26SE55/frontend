import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationMatrixService } from "@/shared/services/notification/notification-matrix.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { UpdateNotificationMatrixPayload } from "@/shared/types/notification/notification-matrix.types";

// Ma trận nhóm × kênh của user hiện tại. Cùng nhịp cache với preference (5 phút).
export const useNotificationMatrix = () =>
  useQuery({
    queryKey: QUERY_KEY.notificationPreferences.matrix(),
    queryFn: () =>
      notificationMatrixService.getMatrix().then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

// Bảng tra cứu type → nhóm. Gần như tĩnh (chỉ đổi khi BE thêm NotificationType).
export const useNotificationCategories = () =>
  useQuery({
    queryKey: QUERY_KEY.notificationPreferences.categories(),
    queryFn: () =>
      notificationMatrixService.getCategories().then((r) => r.data.data ?? []),
    staleTime: 30 * 60_000,
  });

// PUT trả về ma trận đầy đủ sau cập nhật → set thẳng vào cache, khỏi refetch thừa.
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
