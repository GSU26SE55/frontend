// DTO snapshot cho Dashboard server-side aggregate (thay việc FE tự đếm client-side).
// BE class PascalCase serialize camelCase — field dưới đây khớp JSON thực tế.
// A: /api/tickets/dashboard/stats · B: /api/staff/tickets/dashboard/stats
// C: /api/sites/dashboard/stats · D: /api/admin/accounts/stats

export interface SlaSummaryDto {
  met: number;
  breached: number;
  running: number;
  paused: number;
  /** Met / (Met + Breached) × 100; = 100 khi chưa có timer kết thúc. */
  compliancePercent: number;
}

/** 1 điểm trend theo ngày (bucket UTC), ngày trống = 0. */
export interface DailyCountPointDto {
  date: string; // "yyyy-MM-dd"
  count: number;
}

export interface StaffOpenCountDto {
  staffId: string;
  activeCount: number;
}

export interface SlaRiskDto {
  healthy: number;
  near: number;
  breached: number;
}

// A — Ticket dashboard (Admin/Manager, system-wide)
export interface TicketDashboardStatsDto {
  total: number;
  openCount: number;
  sla: SlaSummaryDto;
  /** Đủ 14 status (zero-fill). FE tự nhóm pipeline — KHÔNG gộp ClosedRejected vào "Hoàn tất". */
  countByStatus: Record<string, number>;
  countByPriority: Record<string, number>; // P1Critical / P2High / P3Normal
  createdTrend7Days: DailyCountPointDto[];
  openCountByStaff: StaffOpenCountDto[];
}

// B — Staff ticket dashboard (scope theo JWT)
export interface StaffTicketDashboardStatsDto {
  openCount: number;
  resolvedCount: number;
  nearBreachCount: number;
  breachedCount: number;
  pausedCount: number;
  slaMonitoredCount: number;
  sla: SlaSummaryDto;
  countByStatus: Record<string, number>;
  slaRisk: SlaRiskDto;
  createdTrend7Days: DailyCountPointDto[];
}

// C — Sites dashboard (system-wide, khác /api/sites/{id}/dashboard)
export interface SiteDashboardStatsDto {
  total: number;
  activeCount: number;
  totalBatteries: number;
  activeBatteries: number;
  avgHealth: number;
  atRiskCount: number; // health < 80
}

// D — Accounts stats (Admin/Manager)
export interface AccountStatsDto {
  total: number;
  countByRole: Record<string, number>; // Admin / Manager / Staff / Customer
}
