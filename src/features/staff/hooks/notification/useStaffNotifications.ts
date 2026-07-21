import { useQuery } from "@tanstack/react-query";
import { staffNotificationService } from "@/features/staff/services/notification/notification.service";
import type { StaffNotificationsParams } from "@/features/staff/types/notification/notification.types";

export function useStaffNotifications(params: StaffNotificationsParams) {
  return useQuery({
    queryKey: ["staff", "notifications", params],
    queryFn: () =>
      staffNotificationService.getList(params).then((res) => res.data),
    staleTime: 30_000,
    select: (data) => data.data,
  });
}
