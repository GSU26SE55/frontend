import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, ShieldAlert } from "lucide-react";
import type {
  TicketDTO,
  TicketDetailDTO,
  SlaTimerDTO,
} from "@/shared/types/ticket/ticket.types";
import {
  ActivityActionEnum,
  TicketPriorityEnum,
  TicketStatusEnum,
  SlaTimerStatusEnum,
} from "@/shared/enums/ticket/ticket.enum";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import SlaCountdown from "@/shared/components/ticket/SlaCountdown";
import {
  isSlaClockLive,
  slaBarColorClass,
  calculateResponseDeadline,
  getResponseSlaHours,
  parsePriorityEnum,
  formatDurationHuman,
} from "@/shared/lib/sla";
import { toneClass } from "@/shared/theme/statusColors";
import { cn } from "@/lib/utils";

interface Props {
  ticket: TicketDTO | TicketDetailDTO;
  className?: string;
}

export default function TicketSlaSection({ ticket, className }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activities = (ticket as TicketDetailDTO).activities ?? [];
  const isOpenStage = ticket.status === TicketStatusEnum.Open;

  // ── 1. RESPONSE SLA CALCULATION ──────────────────────────────────────────
  const responseData = useMemo(() => {
    // 1.1 Priority của Response SLA:
    // Response SLA chốt mức ưu tiên ban đầu (lúc tạo phiếu / tiếp nhận).
    // Bất kỳ sự thay đổi mức ưu tiên nào sau này (đổi P ở InProgress hoặc Escalate)
    // chỉ dành cho Resolution SLA và không làm thay đổi Response SLA.
    const responseTimer = ticket.responseSlaTimer ?? (isOpenStage ? ticket.slaTimer : null);

    let priorityAtResponse: TicketPriorityEnum | null = parsePriorityEnum(responseTimer?.priority);

    if (!priorityAtResponse) {
      // Nếu có sự kiện đổi priority thì oldValue của sự kiện đầu tiên chính là priority lúc tạo
      const firstReprioritize = activities.find(
        (a) => a.action === ActivityActionEnum.PriorityAssigned && a.oldValue,
      );
      if (firstReprioritize?.oldValue) {
        priorityAtResponse = parsePriorityEnum(firstReprioritize.oldValue);
      }
    }

    if (!priorityAtResponse) {
      const firstEscalate = activities.find(
        (a) => a.action === ActivityActionEnum.Escalated && a.oldValue,
      );
      if (firstEscalate?.oldValue) {
        priorityAtResponse = parsePriorityEnum(firstEscalate.oldValue);
      }
    }

    if (!priorityAtResponse) {
      const initialPriorityActivity = activities.find(
        (a) => a.action === ActivityActionEnum.PriorityAssigned,
      );
      if (initialPriorityActivity?.newValue) {
        priorityAtResponse = parsePriorityEnum(initialPriorityActivity.newValue);
      }
    }

    if (!priorityAtResponse) {
      priorityAtResponse = parsePriorityEnum(ticket.priority) ?? TicketPriorityEnum.P3Normal;
    }

    const targetHours = getResponseSlaHours(priorityAtResponse);
    const deadline = responseTimer?.dueAt
      ? new Date(responseTimer.dueAt)
      : calculateResponseDeadline(ticket.createdAt, priorityAtResponse);

    // 1.2 Hoạt động phản hồi đầu tiên (StaffAssigned hoặc chuyển từ Open sang Assigned/InProgress)
    const firstResponseActivity = activities.find(
      (a) =>
        a.action === ActivityActionEnum.StaffAssigned ||
        (a.action === ActivityActionEnum.StatusChanged &&
          (a.oldValue === "Open" ||
            a.oldValue === "1" ||
            a.newValue === "Scheduled" ||
            a.newValue === "InProgress")),
    );

    const firstRespondedAt = firstResponseActivity?.createdAt
      ? new Date(firstResponseActivity.createdAt)
      : !isOpenStage && ticket.createdAt
        ? new Date(ticket.createdAt)
        : null;

    const totalMs =
      deadline && ticket.createdAt
        ? Math.max(1, deadline.getTime() - new Date(ticket.createdAt).getTime())
        : targetHours * 3600 * 1000;

    // Check responseTimer status if available from BE
    if (responseTimer) {
      if (responseTimer.status === SlaTimerStatusEnum.Met) {
        const durationMs =
          firstRespondedAt && ticket.createdAt
            ? Math.max(0, firstRespondedAt.getTime() - new Date(ticket.createdAt).getTime())
            : 0;
        return {
          hasResponded: true,
          priorityAtResponse,
          targetHours,
          deadline,
          firstRespondedAt,
          durationMs,
          isMet: true,
          remainingMs: 0,
          remainingPercent: 0,
          isOverdue: false,
        };
      }
      if (responseTimer.status === SlaTimerStatusEnum.Breached) {
        return {
          hasResponded: !isOpenStage,
          priorityAtResponse,
          targetHours,
          deadline,
          firstRespondedAt,
          durationMs:
            firstRespondedAt && ticket.createdAt
              ? Math.max(0, firstRespondedAt.getTime() - new Date(ticket.createdAt).getTime())
              : 0,
          isMet: false,
          remainingMs: deadline ? deadline.getTime() - now : 0,
          remainingPercent: 0,
          isOverdue: true,
        };
      }
    }

    if (firstRespondedAt && deadline) {
      const durationMs = Math.max(
        0,
        firstRespondedAt.getTime() - new Date(ticket.createdAt).getTime(),
      );
      const isMet = firstRespondedAt.getTime() <= deadline.getTime();
      return {
        hasResponded: true,
        priorityAtResponse,
        targetHours,
        deadline,
        firstRespondedAt,
        durationMs,
        isMet,
        remainingMs: 0,
        remainingPercent: 0,
        isOverdue: !isMet,
      };
    }

    // Chưa phản hồi (Ticket vẫn Open) — Response SLA đếm 24/7 calendar liên tục theo thời gian thực
    const remainingMs = deadline ? deadline.getTime() - now : 0;
    const isOverdue = remainingMs <= 0;
    const remainingPercent = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));

    return {
      hasResponded: false,
      priorityAtResponse,
      targetHours,
      deadline,
      firstRespondedAt: null,
      durationMs: 0,
      isMet: false,
      remainingMs,
      remainingPercent,
      isOverdue,
    };
  }, [ticket.createdAt, ticket.priority, ticket.status, ticket.responseSlaTimer, ticket.slaTimer, activities, isOpenStage, now]);

  // ── 1.1 Synthetic / BE Response SlaTimer for unified SlaCountdown badge ────
  const responseSlaTimer: SlaTimerDTO | null = useMemo(() => {
    if (!responseData.deadline) return null;

    const status = responseData.hasResponded
      ? responseData.isMet
        ? SlaTimerStatusEnum.Met
        : SlaTimerStatusEnum.Breached
      : responseData.isOverdue
        ? SlaTimerStatusEnum.Breached
        : SlaTimerStatusEnum.Running;

    return {
      id: "response-sla",
      priority: responseData.priorityAtResponse,
      startedAt: ticket.createdAt,
      dueAt: responseData.deadline.toISOString(),
      originalDueAt: responseData.deadline.toISOString(),
      status,
      remainingPercent: responseData.remainingPercent,
      totalPausedMinutes: 0,
    };
  }, [ticket.createdAt, responseData]);

  // ── 2. RESOLUTION SLA CALCULATION ────────────────────────────────────────
  // Resolution SLA chỉ chạy khi ticket đã bước qua giai đoạn Open (được phân công / InProgress)
  const slaTimer = ticket.resolutionSlaTimer ?? (!isOpenStage ? ticket.slaTimer : null);
  const isResolutionLive = slaTimer ? isSlaClockLive(slaTimer.status) : false;
  const resolutionBarCls = slaTimer
    ? slaBarColorClass(slaTimer.remainingPercent)
    : "";

  return (
    <div className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider">
          SLA Performance
        </p>
      </div>

      {/* ── STAGE 1: RESPONSE SLA ────────────────────────────────────────── */}
      <div className="rounded-lg border border-border/70 bg-card/60 p-3 space-y-2.5">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>1. Response SLA</span>
          </div>
          <SlaCountdown slaTimer={responseSlaTimer} compact />
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-3xs">
              Priority at response
            </span>
            <TicketPriorityBadge priority={responseData.priorityAtResponse} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-3xs">Deadline</span>
            <span className="font-medium tabular-nums text-foreground text-3xs">
              {responseData.deadline
                ? format(responseData.deadline, "dd/MM HH:mm")
                : "—"}
            </span>
          </div>

          {!responseData.hasResponded && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-3xs">Remaining</span>
                <span className="font-medium tabular-nums text-foreground text-3xs">
                  {responseData.remainingPercent.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width,background-color] duration-(--motion-enter) ease-linear ${slaBarColorClass(responseData.remainingPercent)}`}
                  style={{
                    width: `${Math.max(0, responseData.remainingPercent)}%`,
                  }}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-3xs">
              Responded at
            </span>
            <span className="font-medium tabular-nums text-foreground text-3xs">
              {responseData.hasResponded && responseData.firstRespondedAt
                ? `${format(responseData.firstRespondedAt, "dd/MM HH:mm")}${responseData.durationMs > 0 ? ` (after ${formatDurationHuman(responseData.durationMs)})` : ""}`
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ── STAGE 2: RESOLUTION SLA ─────────────────────────────────────── */}
      <div className="rounded-lg border border-border/70 bg-card/60 p-3 space-y-2.5">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <ShieldAlert className="size-3.5 text-muted-foreground" />
            <span>2. Resolution SLA</span>
          </div>
          {isOpenStage ? (
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-3xs font-medium ${toneClass("muted")}`}
            >
              Not started
            </span>
          ) : (
            <SlaCountdown slaTimer={slaTimer} compact />
          )}
        </div>

        {isOpenStage ? (
          <div className="py-2 text-center text-3xs text-muted-foreground">
            Resolution SLA starts once the ticket is assigned and moved to InProgress.
          </div>
        ) : slaTimer ? (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-3xs">
                Current priority
              </span>
              <TicketPriorityBadge priority={ticket.priority} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-3xs">
                Deadline
              </span>
              <span className="font-medium tabular-nums text-foreground text-3xs">
                {format(new Date(slaTimer.dueAt), "dd/MM HH:mm")}
              </span>
            </div>

            {isResolutionLive && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-3xs">
                    Remaining
                  </span>
                  <span className="font-medium tabular-nums text-foreground text-3xs">
                    {slaTimer.remainingPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width,background-color] duration-(--motion-enter) ease-linear ${resolutionBarCls}`}
                    style={{
                      width: `${Math.max(0, slaTimer.remainingPercent)}%`,
                    }}
                  />
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-3xs">
                Resolved at
              </span>
              <span className="font-medium tabular-nums text-foreground text-3xs">
                {(ticket as TicketDetailDTO).resolvedAt
                  ? format(new Date((ticket as TicketDetailDTO).resolvedAt!), "dd/MM HH:mm")
                  : "—"}
              </span>
            </div>

            {slaTimer.status === SlaTimerStatusEnum.Breached && (
              <div className="space-y-1 text-3xs">
                <div className="text-destructive font-medium">
                  SLA deadline has breached. Prioritize resolution.
                </div>
                {slaTimer.rescueRemainingMinutes != null && slaTimer.rescueRemainingMinutes > 0 && (
                  <div className="text-amber-600 dark:text-amber-400 font-medium">
                    Rescue window: {Math.floor(slaTimer.rescueRemainingMinutes / 60)}h {slaTimer.rescueRemainingMinutes % 60}m remaining
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-2 text-center text-3xs text-muted-foreground">
            No Resolution SLA configured for this ticket.
          </div>
        )}
      </div>
    </div>
  );
}
