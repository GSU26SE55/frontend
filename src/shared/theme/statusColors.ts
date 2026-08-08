// The SINGLE source that maps status → semantic color, built around the CSS tokens in
// index.css (--ok/--info/--p1/--p2/--p3/--muted-status, each with a dark variant). Status
// colors used to be hardcoded all over the place (shadcn variant / bg-emerald / hex) and
// drifted out of sync between admin/manager/staff — this file replaces that.
//
// Usage:
//   className={toneClass(TICKET_STATUS_TONE[status])}   // soft-bg, bold-text badge
//   const { fg, bg, border } = toneVars(tone)           // when an inline style is needed

import {
  TicketStatusEnum,
  TicketPriorityEnum,
} from "@/shared/enums/ticket/ticket.enum";
import { SlaTimerStatusEnum } from "@/shared/enums/ticket/ticket.enum";
import {
  AlertSeverityEnum,
  AlertStatusEnum,
} from "@/shared/enums/alerts/alert.enum";
import { EnvironmentalIncidentStatusEnum } from "@/shared/enums/alerts/environmental.enum";
import { IotDeviceStatusEnum } from "@/shared/enums/iot/iot.enum";
import { KbArticleStatusEnum } from "@/shared/enums/kb/kb.enum";
import { BatteryStatusEnum } from "@/shared/enums/battery/battery.enum";
import { AccountStatusEnum } from "@/shared/enums/account/account.enum";
import { NotificationStatusEnum } from "@/shared/enums/notification/notification.enum";
import {
  BlogPostStatusEnum,
  BlogPostOriginEnum,
} from "@/shared/enums/blog/blog.enum";

// 6 semantic color tones — match the tokens in index.css.
export type StatusTone = "ok" | "info" | "p3" | "p2" | "p1" | "muted";

/** Soft-bg badge className + bold text/border for the tone. Dark mode handled automatically via tokens. */
export function toneClass(tone: StatusTone): string {
  switch (tone) {
    case "ok":
      return "bg-ok-soft text-ok border border-ok/30";
    case "info":
      return "bg-info-soft text-info border border-info/30";
    case "p3":
      return "bg-p3-soft text-p3 border border-p3/30";
    case "p2":
      return "bg-p2-soft text-p2 border border-p2/30";
    case "p1":
      return "bg-p1-soft text-p1 border border-p1/30";
    case "muted":
    default:
      return "bg-muted-status-soft text-muted-status border border-muted-status/30";
  }
}

/** Faint bg class (~15%) + bold text — for pills/tags (lighter than the soft badge). */
export function toneFill(tone: StatusTone): string {
  switch (tone) {
    case "ok":
      return "bg-ok/15 text-ok";
    case "info":
      return "bg-info/15 text-info";
    case "p3":
      return "bg-p3/15 text-p3";
    case "p2":
      return "bg-p2/15 text-p2";
    case "p1":
      return "bg-p1/15 text-p1";
    case "muted":
    default:
      return "bg-muted text-muted-foreground";
  }
}

/** Text-only class for the tone — when coloring text (numbers/labels) with no background. */
export function toneText(tone: StatusTone): string {
  switch (tone) {
    case "ok":
      return "text-ok";
    case "info":
      return "text-info";
    case "p3":
      return "text-p3";
    case "p2":
      return "text-p2";
    case "p1":
      return "text-p1";
    case "muted":
    default:
      return "text-muted-foreground";
  }
}

/** Solid bg class for the tone — for a status dot, not the soft badge. */
export function toneDot(tone: StatusTone): string {
  switch (tone) {
    case "ok":
      return "bg-ok";
    case "info":
      return "bg-info";
    case "p3":
      return "bg-p3";
    case "p2":
      return "bg-p2";
    case "p1":
      return "bg-p1";
    case "muted":
    default:
      return "bg-muted-status";
  }
}

/** Raw CSS variables for inline style (when backgroundColor/color/borderColor is needed directly). */
export function toneVars(tone: StatusTone): {
  fg: string;
  bg: string;
  border: string;
} {
  const t = tone === "muted" ? "muted-status" : tone;
  return { fg: `var(--${t})`, bg: `var(--${t}-soft)`, border: `var(--${t})` };
}

// ── Maps per enum (fallback outside the map → "muted") ───────────────────────

export const TICKET_STATUS_TONE: Record<TicketStatusEnum, StatusTone> = {
  [TicketStatusEnum.New]: "info",
  [TicketStatusEnum.Open]: "info",
  [TicketStatusEnum.Assigned]: "info",
  [TicketStatusEnum.InProgress]: "info",
  [TicketStatusEnum.ClosedPendingRate]: "info",
  [TicketStatusEnum.WaitingCustomer]: "p3",
  [TicketStatusEnum.WaitingParts]: "p3",
  [TicketStatusEnum.WaitingOnsiteSchedule]: "p3",
  [TicketStatusEnum.Resolved]: "ok",
  [TicketStatusEnum.Closed]: "ok",
  [TicketStatusEnum.Escalated]: "p1",
  [TicketStatusEnum.ClosedRejected]: "p1",
  [TicketStatusEnum.Incident]: "p1",
};

export const TICKET_PRIORITY_TONE: Record<TicketPriorityEnum, StatusTone> = {
  [TicketPriorityEnum.P1Critical]: "p1",
  [TicketPriorityEnum.P2High]: "p2",
  [TicketPriorityEnum.P3Normal]: "p3",
};

export const SLA_TIMER_TONE: Record<SlaTimerStatusEnum, StatusTone> = {
  [SlaTimerStatusEnum.Running]: "info",
  [SlaTimerStatusEnum.Paused]: "p3",
  [SlaTimerStatusEnum.Met]: "ok",
  [SlaTimerStatusEnum.Breached]: "p1",
};

// Used by AlertSeverityBadge AND BatteryAuditLogTable (same Info/Warning/Critical scale).
export const ALERT_SEVERITY_TONE: Record<AlertSeverityEnum, StatusTone> = {
  [AlertSeverityEnum.Info]: "info",
  [AlertSeverityEnum.Warning]: "p2",
  [AlertSeverityEnum.Critical]: "p1",
};

export const ALERT_STATUS_TONE: Record<AlertStatusEnum, StatusTone> = {
  [AlertStatusEnum.Open]: "p2",
  [AlertStatusEnum.Acknowledged]: "info",
  [AlertStatusEnum.Merged]: "muted",
  [AlertStatusEnum.Resolved]: "ok",
};

export const INCIDENT_STATUS_TONE: Record<
  EnvironmentalIncidentStatusEnum,
  StatusTone
> = {
  [EnvironmentalIncidentStatusEnum.Open]: "p1",
  [EnvironmentalIncidentStatusEnum.Acknowledged]: "p2",
  [EnvironmentalIncidentStatusEnum.Resolved]: "ok",
  [EnvironmentalIncidentStatusEnum.FalseAlarm]: "muted",
};

export const IOT_DEVICE_STATUS_TONE: Record<IotDeviceStatusEnum, StatusTone> = {
  [IotDeviceStatusEnum.Pending]: "p3",
  [IotDeviceStatusEnum.Active]: "ok",
  [IotDeviceStatusEnum.Offline]: "p2",
  [IotDeviceStatusEnum.Disabled]: "p1",
  [IotDeviceStatusEnum.Decommissioned]: "muted",
};

export const KB_STATUS_TONE: Record<KbArticleStatusEnum, StatusTone> = {
  [KbArticleStatusEnum.Draft]: "muted",
  [KbArticleStatusEnum.PendingReview]: "p3",
  [KbArticleStatusEnum.Published]: "ok",
  [KbArticleStatusEnum.Archived]: "muted",
};

export const BLOG_STATUS_TONE: Record<BlogPostStatusEnum, StatusTone> = {
  [BlogPostStatusEnum.Generating]: "info",
  [BlogPostStatusEnum.GenerationFailed]: "p1",
  [BlogPostStatusEnum.Draft]: "muted",
  [BlogPostStatusEnum.Published]: "ok",
  [BlogPostStatusEnum.Archived]: "muted",
};

export const BLOG_ORIGIN_TONE: Record<BlogPostOriginEnum, StatusTone> = {
  [BlogPostOriginEnum.Manual]: "muted",
  [BlogPostOriginEnum.AiGeneratedFromKb]: "info",
};

export const BATTERY_STATUS_TONE: Record<BatteryStatusEnum, StatusTone> = {
  [BatteryStatusEnum.Active]: "ok",
  [BatteryStatusEnum.Inactive]: "muted",
  [BatteryStatusEnum.Decommissioned]: "muted",
};

export const ACCOUNT_STATUS_TONE: Record<number, StatusTone> = {
  [AccountStatusEnum.PendingVerification]: "p3",
  [AccountStatusEnum.Active]: "ok",
  [AccountStatusEnum.Locked]: "p1",
  [AccountStatusEnum.Inactive]: "muted",
  [AccountStatusEnum.Suspended]: "p1",
  [AccountStatusEnum.Banned]: "p1",
};

export const NOTIFICATION_STATUS_TONE: Record<number, StatusTone> = {
  [NotificationStatusEnum.Pending]: "p3",
  [NotificationStatusEnum.Sent]: "info",
  [NotificationStatusEnum.Failed]: "p1",
  [NotificationStatusEnum.Read]: "muted",
  // Sprint 6.3 NOTI3-14 — Delivered/Opened have been missing here since this was created, so
  // they fell back to "muted" and looked exactly like already-read. GH-792 adds Processing.
  [NotificationStatusEnum.Delivered]: "ok",
  [NotificationStatusEnum.Opened]: "muted",
  [NotificationStatusEnum.Processing]: "p3",
};

// Cascade risk (BE returns string-name "Low"/"Medium"/"High").
export const CASCADE_RISK_TONE: Record<string, StatusTone> = {
  Low: "ok",
  Medium: "p2",
  High: "p1",
};

// Alert→Ticket saga state (MassTransit returns string-name, not a numeric enum).
export const SAGA_STATE_TONE: Record<string, StatusTone> = {
  Initial: "muted",
  TicketRequested: "info",
  TicketProvisioned: "info",
  AlertLinkRequested: "info",
  Completed: "ok",
  Failed: "p1",
};

/** Health score 0-100 → tone (used by SiteDashboardCard). */
export function healthScoreTone(score: number): StatusTone {
  if (score >= 80) return "ok";
  if (score >= 50) return "p3";
  return "p1";
}
