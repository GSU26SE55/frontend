import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/shared/services/dashboard/analytics.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { DashboardStatsParams } from "@/shared/types/dashboard/analytics.types";

// Battery dashboard stats — gom KPI + chart trong 1 call. staleTime 1 phút (fe.md).
export const useBatteryDashboardStats = (params?: DashboardStatsParams) =>
  useQuery({
    queryKey: QUERY_KEY.batteryDashboard.stats(params),
    queryFn: () =>
      analyticsService.getDashboardStats(params).then((r) => r.data.data),
    staleTime: 60_000,
  });
