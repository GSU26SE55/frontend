import axiosInstance from "@/shared/lib/axios";
import { ENDPOINTS } from "@/shared/utils/endpoints";
import type { CommonResponse } from "@/shared/types/api.types";
import type {
  TicketDashboardStatsDto,
  StaffTicketDashboardStatsDto,
  SiteDashboardStatsDto,
  AccountStatsDto,
} from "@/shared/types/dashboard/dashboardStats.types";

// Aggregate snapshot for the Dashboard — each endpoint is 1 call that rolls up KPIs, no from/to.
export const dashboardStatsService = {
  // A — Ticket stats (Admin/Manager)
  getTicketStats: () =>
    axiosInstance.get<CommonResponse<TicketDashboardStatsDto>>(
      ENDPOINTS.TICKETS.DASHBOARD_STATS,
    ),
  // B — Staff ticket stats (scope JWT)
  getStaffTicketStats: () =>
    axiosInstance.get<CommonResponse<StaffTicketDashboardStatsDto>>(
      ENDPOINTS.STAFF_TICKETS.DASHBOARD_STATS,
    ),
  // C — Sites stats (Admin/Manager)
  getSiteStats: () =>
    axiosInstance.get<CommonResponse<SiteDashboardStatsDto>>(
      ENDPOINTS.SITES.DASHBOARD_STATS,
    ),
  // D — Accounts stats (Admin/Manager)
  getAccountStats: () =>
    axiosInstance.get<CommonResponse<AccountStatsDto>>(
      ENDPOINTS.ADMIN.ACCOUNTS.STATS,
    ),
};
