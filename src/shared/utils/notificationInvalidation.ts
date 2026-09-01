import { KEY } from "@/shared/utils/queryKeys";
import { NotificationTypeEnum } from "@/shared/enums/notification/notification.enum";

/**
 * Maps an incoming realtime notification to the query branches whose COUNTS it invalidates.
 *
 * Why this exists: the notification feed is realtime (SignalR), but every sidebar badge is a
 * separate REST query with its own staleTime — 30s for alerts/incidents/queue, 60s for the
 * Guide and Blog counts, which do not poll at all. So a notification could pop instantly
 * while the badge next to it stayed wrong for up to a minute. The badge and the notification
 * describe the SAME event, so the event that refreshes one has to refresh the other.
 *
 * Why invalidate instead of patching the number by hand: a badge is a server-side COUNT over
 * a filtered set (Open + Acknowledged, PendingReview, Draft, unassigned queue…), and the
 * notification does not say which side of that filter the row landed on. Incrementing by one
 * would drift the moment somebody else resolves an alert in the same second. Invalidating
 * costs one small pageSize=1 request and is always right.
 *
 * Only the count queries that a user can actually SEE change here — nothing else — because
 * React Query skips refetching queries with no mounted observer, so a key listed for a role
 * that never renders it is free.
 */

// Branch roots. Only KEY.* prefixes, never a full key: the counts are keyed with their own
// params object (pageSize 1, one status each), and every one of them must be refreshed.
const ALERTS = [KEY.alerts] as const;
const INCIDENTS = [KEY.environmentalIncidents] as const;
// Màn Environment (số đo mới nhất + bảng lịch sử) tự tải lại mỗi 20s, còn thiết bị đẩy mỗi 15s
// — cộng lại là số đo đã gây ra alert có thể mất tới ~35s mới xuất hiện trên bảng, trong khi
// chuông báo đã kêu từ trước đó. Nối vào hub để đúng lúc alert tới thì bảng nạp lại ngay.
const AMBIENT = [KEY.ambient] as const;
const KB = [KEY.kb] as const;
const BLOG = [KEY.blog] as const;
// Manager's Queue badge reads QUERY_KEY.manager.tickets.queue — that branch also carries the
// Manager ticket list, which is worth refreshing on the same events anyway.
const MANAGER_TICKETS = [...KEY.manager.tickets] as const;
const ADMIN_TICKETS = [...KEY.admin.tickets] as const;
const STAFF_TICKETS = [KEY.staffTickets] as const;
// Ticket badges/lists across all three roles — a ticket event changes whichever list the
// current role happens to be looking at, and only mounted ones refetch.
const ANY_TICKETS = [MANAGER_TICKETS, ADMIN_TICKETS, STAFF_TICKETS] as const;

const T = NotificationTypeEnum;

/**
 * type → the query-key prefixes to invalidate. A type that is absent (chat, account,
 * participant, blog-generation-failed…) changes no badge and deliberately triggers nothing:
 * firing a refetch for every notification would put back exactly the polling this replaces.
 */
const INVALIDATION_MAP: Partial<
  Record<NotificationTypeEnum, readonly (readonly unknown[])[]>
> = {
  // ── Tickets ────────────────────────────────────────────────────────────────
  // A new ticket lands unassigned → it enters the Manager Queue, which is what the "Queue"
  // badge counts.
  // ALSO invalidate ALERTS: the saga that auto-creates a ticket from a battery/device/site
  // alert writes the new `ticketId` back onto that alert row. Without this, the alert
  // table/badges keep showing "no ticket" until their own 30s staleTime/refetchInterval
  // catches up — even though the bell already fired for the new ticket.
  [T.TicketCreated]: [ALERTS, ...ANY_TICKETS],
  // Assignment takes it OUT of the queue and INTO someone's list — both counts move.
  [T.TicketAssigned]: ANY_TICKETS,
  [T.TicketStatusChanged]: ANY_TICKETS,
  [T.TicketResolved]: ANY_TICKETS,
  [T.TicketClosed]: ANY_TICKETS,
  [T.TicketEscalated]: ANY_TICKETS,
  [T.TicketApproved]: ANY_TICKETS,
  [T.TicketRejected]: ANY_TICKETS,
  [T.TicketReopened]: ANY_TICKETS,
  [T.TicketMerged]: ANY_TICKETS,
  [T.TicketWorkStarted]: ANY_TICKETS,
  [T.TicketScheduleChanged]: ANY_TICKETS,
  // SLA events do not move a ticket between lists, but they change the row's SLA state, which
  // the Queue orders by — a stale list shows the wrong thing at the top.
  [T.SlaWarning]: ANY_TICKETS,
  [T.SlaBreached]: ANY_TICKETS,
  [T.SlaAutoResumed]: ANY_TICKETS,

  // ── Battery alerts ─────────────────────────────────────────────────────────
  // The badge counts Open + Acknowledged. A new anomaly at ANY severity writes an alert row,
  // so all three severities count — the badge does not filter by severity.
  // AMBIENT đi kèm: alert MÔI TRƯỜNG (nhiệt độ / độ ẩm / gas của tủ) cũng phát dưới ba loại
  // thông báo này — đường ambient publish `BatteryAnomalyDetectedEvent` /
  // `BatteryAnomalyWarningDetectedEvent`, không có loại thông báo riêng. Bỏ AMBIENT ở đây là
  // đúng ca người dùng gặp: chuông kêu vì nhiệt độ tủ vượt ngưỡng mà bảng Environment vẫn
  // đứng im tới hết chu kỳ poll.
  [T.BatteryAnomalyDetected]: [ALERTS, AMBIENT],
  [T.BatteryAnomalyWarning]: [ALERTS, AMBIENT],
  [T.BatteryAnomalyInfo]: [ALERTS, AMBIENT],
  // Escalation means an alert sat unacknowledged — the row is still Open, but the saga may
  // have spawned a ticket off it, so both branches move.
  [T.BatteryAlertEscalationPending]: [ALERTS, ...ANY_TICKETS],
  [T.CascadeRiskHigh]: [ALERTS],
  // The saga failing leaves the alert without the ticket it should have produced.
  [T.AlertTicketSagaFailed]: [ALERTS, ...ANY_TICKETS],

  // ── Device alerts (IoT gateway) ─────────────────────────────────────────────
  // The Device alerts badge counts Open + Acknowledged rows with iotOnly: true — the same
  // ALERTS branch as Battery alerts, just filtered the opposite way (see
  // useUnresolvedDeviceAlertCount). Went-offline raises the count; recovered/decommissioned
  // resolve or remove the row, so both directions must invalidate.
  [T.IotDeviceWentOffline]: [ALERTS],
  [T.IotDeviceRecovered]: [ALERTS],
  [T.IotDeviceAutoDecommissioned]: [ALERTS],

  // ── Environmental incidents ────────────────────────────────────────────────
  // Detected raises the count; Resolved lowers it. Both must invalidate — dropping the
  // resolved case is how a badge gets stuck showing work that is already done.
  // ALSO invalidate ALERTS: every EnvironmentalIncident writes a mirror row into the alerts
  // table (site-level, `environmentalIncidentId` set — see AlertDto) so it also shows up in
  // the alert badges/table. Without this, that mirror row stays stale for up to 30s after
  // the bell already announced it — same reasoning as IncidentDeclared below.
  [T.EnvironmentalIncidentDetected]: [INCIDENTS, ALERTS, AMBIENT],
  [T.EnvironmentalIncidentResolved]: [INCIDENTS, ALERTS, AMBIENT],
  [T.IncidentDeclared]: [INCIDENTS, ALERTS, AMBIENT],

  // ── Guide (KB) ─────────────────────────────────────────────────────────────
  // All three move the Guide badges, because "awaiting approval" and "drafts" are counts over
  // the SAME article set: submitting for review moves an article INTO pendingReview, and a
  // decision moves it back OUT (to Published, or to Draft on reject). Routing only the
  // "requested" side would make the badge climb in realtime and fall on a 60s delay.
  [T.KbArticleReviewRequested]: [KB],
  [T.KbArticleReviewApproved]: [KB],
  [T.KbArticleReviewRejected]: [KB],

  // ── Blog ───────────────────────────────────────────────────────────────────
  // A generated post is written as a Draft → the muted "drafts" badge goes up.
  [T.BlogGenerationCompleted]: [BLOG],
};

/**
 * Every branch any badge reads from — used on RECONNECT, where the notification that would
 * have named a specific branch is exactly what was missed. Blog matters most here: its count
 * has a 60s staleTime and does not poll, so an outage is the one moment it can stay wrong
 * indefinitely rather than self-correcting on the next tick.
 */
export const BADGE_BRANCHES: readonly (readonly unknown[])[] = [
  ALERTS,
  INCIDENTS,
  BLOG,
  KB,
  MANAGER_TICKETS,
  ADMIN_TICKETS,
  STAFF_TICKETS,
];

/**
 * Returns the query-key prefixes to invalidate for this notification type, or an empty array
 * when the type moves no badge.
 */
export function invalidationKeysFor(
  type: NotificationTypeEnum | undefined | null,
): readonly (readonly unknown[])[] {
  if (typeof type !== "number") return [];
  return INVALIDATION_MAP[type as NotificationTypeEnum] ?? [];
}

/** Shape of the SignalR payload for "NotificationCreated" / "NotificationReceived". */
export interface RealtimeNotificationPayload {
  id?: string;
  // Sent as a NUMBER: the notification hub is registered WITHOUT JsonStringEnumConverter
  // (see NotificationService Program.cs), so these line up with NotificationTypeEnum directly.
  type?: NotificationTypeEnum;
  entityType?: string | null;
  entityId?: string | null;
}
