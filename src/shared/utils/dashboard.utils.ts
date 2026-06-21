import type { TicketDTO } from "@/shared/types/ticket.types";
import {
  SlaTimerStatusEnum,
  TicketStatusEnum,
  TicketPriorityEnum,
} from "@/shared/enums/ticket.enum";
import type { AlertDto } from "@/shared/types/alert.types";
import { AlertSeverityEnum } from "@/shared/enums/alert.enum";

/**
 * Pure aggregation helpers cho dashboard (Admin / Manager / Staff).
 *
 * ⚠️ Độ chính xác: các hàm count/SLA bên dưới tính client-side từ MỘT TRANG
 * list endpoint (pageSize ~200) — là xấp xỉ phục vụ dashboard. Hệ thống chưa
 * có endpoint aggregate server-side; con số vẫn phản ánh dữ liệu thật và tốt
 * hơn giá trị hardcode trước đây.
 */

// ── Site health ──────────────────────────────────────────────────────────────
export function siteHealth(s: {
  batteryAssetCount: number;
  activeBatteryAssetCount: number;
}): number {
  return s.batteryAssetCount > 0
    ? Math.round((s.activeBatteryAssetCount / s.batteryAssetCount) * 100)
    : 100;
}

/** Màu theo health %: >=80 ok · >=60 p3 · còn lại p1 */
export function healthColor(h: number): string {
  return h >= 80 ? "var(--ok)" : h >= 60 ? "var(--p3)" : "var(--p1)";
}

// ── Ticket: open / SLA ───────────────────────────────────────────────────────
const TERMINAL_STATUSES = new Set<string>([
  TicketStatusEnum.Resolved,
  TicketStatusEnum.ClosedPendingRate,
  TicketStatusEnum.Closed,
  TicketStatusEnum.ClosedRejected,
]);

/** Ticket đang "mở" — chưa kết thúc vòng đời. */
export function isOpenTicket(t: TicketDTO): boolean {
  return !TERMINAL_STATUSES.has(t.status);
}

export interface SlaSummary {
  met: number;
  breached: number;
  running: number;
  paused: number;
  /** met / (met + breached) × 100 — null nếu chưa ticket nào có kết quả SLA */
  compliancePercent: number | null;
}

export function summarizeSla(tickets: TicketDTO[]): SlaSummary {
  let met = 0;
  let breached = 0;
  let running = 0;
  let paused = 0;
  for (const t of tickets) {
    const status = t.slaTimer?.status;
    if (status === SlaTimerStatusEnum.Met) met++;
    else if (status === SlaTimerStatusEnum.Breached) breached++;
    else if (status === SlaTimerStatusEnum.Running) running++;
    else if (status === SlaTimerStatusEnum.Paused) paused++;
  }
  const decided = met + breached;
  return {
    met,
    breached,
    running,
    paused,
    compliancePercent:
      decided > 0 ? Math.round((met / decided) * 1000) / 10 : null,
  };
}

// ── Ticket: counts ───────────────────────────────────────────────────────────
export function countTicketsByStatus(
  tickets: TicketDTO[],
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const t of tickets) acc[t.status] = (acc[t.status] ?? 0) + 1;
  return acc;
}

export function countTicketsByPriority(
  tickets: TicketDTO[],
): Record<string, number> {
  const acc: Record<string, number> = {
    [TicketPriorityEnum.P1Critical]: 0,
    [TicketPriorityEnum.P2High]: 0,
    [TicketPriorityEnum.P3Normal]: 0,
  };
  for (const t of tickets) {
    if (t.priority) acc[t.priority] = (acc[t.priority] ?? 0) + 1;
  }
  return acc;
}

// ── Time-series helpers ──────────────────────────────────────────────────────
const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** `days` ngày gần nhất (cũ → mới) kèm key ISO date + nhãn thứ. */
function lastNDays(days: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push({ key: d.toISOString().slice(0, 10), label: DOW[d.getDay()] });
  }
  return out;
}

export function groupAlertsByDay(
  alerts: AlertDto[],
  days = 7,
): { day: string; critical: number; warning: number; info: number }[] {
  const rows = lastNDays(days).map((b) => ({
    key: b.key,
    day: b.label,
    critical: 0,
    warning: 0,
    info: 0,
  }));
  const index = new Map(rows.map((r, i) => [r.key, i]));
  for (const a of alerts) {
    const i = index.get(a.detectedAt?.slice(0, 10) ?? "");
    if (i === undefined) continue;
    const row = rows[i];
    if (a.severity === AlertSeverityEnum.Critical) row.critical++;
    else if (a.severity === AlertSeverityEnum.Warning) row.warning++;
    else row.info++;
  }
  return rows.map(({ day, critical, warning, info }) => ({
    day,
    critical,
    warning,
    info,
  }));
}

export function groupTicketsByDay(
  tickets: TicketDTO[],
  days = 7,
): { day: string; count: number }[] {
  const rows = lastNDays(days).map((b) => ({ key: b.key, day: b.label, count: 0 }));
  const index = new Map(rows.map((r, i) => [r.key, i]));
  for (const t of tickets) {
    const i = index.get(t.createdAt?.slice(0, 10) ?? "");
    if (i !== undefined) rows[i].count++;
  }
  return rows.map(({ day, count }) => ({ day, count }));
}
