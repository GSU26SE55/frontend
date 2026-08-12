// Snapshot DTOs for the server-side Dashboard aggregates (replacing client-side
// counting in the FE). The BE's PascalCase classes serialize to camelCase — the
// fields below match the actual JSON.
// A: /api/tickets/dashboard/stats · B: /api/staff/tickets/dashboard/stats
// C: /api/sites/dashboard/stats · D: /api/admin/accounts/stats

export interface SlaSummaryDto {
  met: number;
  breached: number;
  running: number;
  paused: number;
  /** Met / (Met + Breached) × 100; = 100 when no timer has finished yet. */
  compliancePercent: number;
}

/** One daily trend point (UTC bucket); empty days = 0. */
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
  /** All 14 statuses (zero-filled). The FE groups the pipeline itself — do NOT fold
   * ClosedRejected into "Completed". */
  countByStatus: Record<string, number>;
  countByPriority: Record<string, number>; // P1Critical / P2High / P3Normal
  createdTrend7Days: DailyCountPointDto[];
  openCountByStaff: StaffOpenCountDto[];
}

// B — Staff ticket dashboard (scoped by JWT)
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

// C — Sites dashboard (system-wide; distinct from /api/sites/{id}/dashboard)
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
