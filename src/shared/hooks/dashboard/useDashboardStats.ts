import { useQuery } from "@tanstack/react-query";
import { dashboardStatsService } from "@/shared/services/dashboard/dashboardStats.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

// Dashboard snapshot stats — staleTime 1 minute (fe.md). Not realtime.

// A — Ticket stats (Admin/Manager)
export const useTicketDashboardStats = () =>
  useQuery({
    queryKey: QUERY_KEY.ticketDashboard.stats(),
    queryFn: () =>
      dashboardStatsService.getTicketStats().then((r) => r.data.data),
    staleTime: 60_000,
  });

// B — Staff ticket stats (scope JWT)
export const useStaffTicketDashboardStats = () =>
  useQuery({
    queryKey: QUERY_KEY.staffTicketDashboard.stats(),
    queryFn: () =>
      dashboardStatsService.getStaffTicketStats().then((r) => r.data.data),
    staleTime: 60_000,
  });

// C — Sites stats (Admin/Manager)
export const useSiteDashboardStats = () =>
  useQuery({
    queryKey: QUERY_KEY.siteDashboard.stats(),
    queryFn: () =>
      dashboardStatsService.getSiteStats().then((r) => r.data.data),
    staleTime: 60_000,
  });

// D — Accounts stats (Admin/Manager)
export const useAccountStats = () =>
  useQuery({
    queryKey: QUERY_KEY.accountStats.stats(),
    queryFn: () =>
      dashboardStatsService.getAccountStats().then((r) => r.data.data),
    staleTime: 60_000,
  });
