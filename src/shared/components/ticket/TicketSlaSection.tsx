import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
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
import { useLiveSlaPercent } from "@/shared/hooks/ticket/useLiveSlaPercent";
import {
  isSlaClockLive,
  slaBarColorClass,
  calculateResponseDeadline,
  getResponseSlaHours,
  parsePriorityEnum,
  formatDurationHuman,
  formatCalendarExtension,
  formatCalendarExtensionDays,
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
    const responseTimer =
      ticket.responseSlaTimer ?? (isOpenStage ? ticket.slaTimer : null);

    let priorityAtResponse: TicketPriorityEnum | null = parsePriorityEnum(
      responseTimer?.priority,
    );

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
        priorityAtResponse = parsePriorityEnum(
          initialPriorityActivity.newValue,
        );
      }
    }

    if (!priorityAtResponse) {
      priorityAtResponse =
        parsePriorityEnum(ticket.priority) ?? TicketPriorityEnum.P3Normal;
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
            ? Math.max(
                0,
                firstRespondedAt.getTime() -
                  new Date(ticket.createdAt).getTime(),
              )
            : 0;
        return {
          hasResponded: true,
          priorityAtResponse,
          targetHours,
          deadline,
          firstRespondedAt,
          durationMs,
          overdueMs: 0,
          isMet: true,
          remainingMs: 0,
          remainingPercent: 0,
          isOverdue: false,
        };
      }
      if (responseTimer.status === SlaTimerStatusEnum.Breached) {
        const hasResponded = !isOpenStage;
        const durationMs =
          firstRespondedAt && ticket.createdAt
            ? Math.max(
                0,
                firstRespondedAt.getTime() -
                  new Date(ticket.createdAt).getTime(),
              )
            : 0;
        const overdueAtResponse =
          hasResponded && firstRespondedAt && deadline
            ? Math.max(0, firstRespondedAt.getTime() - deadline.getTime())
            : 0;
        return {
          hasResponded,
          priorityAtResponse,
          targetHours,
          deadline,
          firstRespondedAt,
          durationMs,
          overdueMs: hasResponded
            ? overdueAtResponse
            : deadline
              ? Math.max(0, now - deadline.getTime())
              : 0,
          isMet: false,
          remainingMs: hasResponded
            ? -overdueAtResponse
            : deadline
              ? deadline.getTime() - now
              : 0,
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
      const overdueMs = isMet
        ? 0
        : Math.max(0, firstRespondedAt.getTime() - deadline.getTime());
      return {
        hasResponded: true,
        priorityAtResponse,
        targetHours,
        deadline,
        firstRespondedAt,
        durationMs,
        overdueMs,
        isMet,
        remainingMs: 0,
        remainingPercent: 0,
        isOverdue: !isMet,
      };
    }

    // Chưa phản hồi (Ticket vẫn Open) — Response SLA đếm 24/7 calendar liên tục theo thời gian thực
    const remainingMs = deadline ? deadline.getTime() - now : 0;
    const isOverdue = remainingMs <= 0;
    const remainingPercent = Math.min(
      100,
      Math.max(0, (remainingMs / totalMs) * 100),
    );

    return {
      hasResponded: false,
      priorityAtResponse,
      targetHours,
      deadline,
      firstRespondedAt: null,
      durationMs: 0,
      overdueMs: isOverdue ? Math.abs(remainingMs) : 0,
      isMet: false,
      remainingMs,
      remainingPercent,
      isOverdue,
    };
  }, [
    ticket.createdAt,
    ticket.priority,
    ticket.status,
    ticket.responseSlaTimer,
    ticket.slaTimer,
    activities,
    isOpenStage,
    now,
  ]);

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
  const slaTimer =
    ticket.resolutionSlaTimer ?? (!isOpenStage ? ticket.slaTimer : null);
  const isResolutionLive = slaTimer ? isSlaClockLive(slaTimer.status) : false;
  // Bar chạy realtime cùng nhịp text — nội suy từ snapshot working-time của BE.
  const resolutionPercent = useLiveSlaPercent(slaTimer);
  const resolutionBarCls = slaTimer ? slaBarColorClass(resolutionPercent) : "";
  const calendarExtensionLabel = formatCalendarExtension(
    slaTimer?.calendarExtensionDays,
  );
  const calendarExtensionDays = formatCalendarExtensionDays(
    slaTimer?.calendarExtensionDays,
  );

  // Default collapsed once a stage already has an outcome (nothing live left to watch) —
  // keeps both stages visible at once from reading as noisy. Lazy-init only, so a user's
  // manual toggle isn't overridden on every re-render as the live timer ticks.
  const [responseExpanded, setResponseExpanded] = useState(
    () => !responseData.hasResponded,
  );
  const [resolutionExpanded, setResolutionExpanded] = useState(
    () => isOpenStage || isResolutionLive,
  );

  return (
    <div className={cn("p-4", className)}>
      <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        SLA Performance
      </p>

      {/* ── STAGE 1: RESPONSE SLA ────────────────────────────────────────── */}
      <div className="space-y-2.5 pb-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-semibold text-foreground"
            onClick={() => setResponseExpanded((v) => !v)}
          >
            {responseExpanded ? (
              <ChevronDown
                size={14}
                className="shrink-0 text-muted-foreground"
              />
            ) : (
              <ChevronRight
                size={14}
                className="shrink-0 text-muted-foreground"
              />
            )}
            1. Response SLA
          </button>
          <SlaCountdown
            slaTimer={responseSlaTimer}
            compact
            completedAt={
              responseData.hasResponded ? responseData.firstRespondedAt : null
            }
          />
        </div>

        {responseExpanded && (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Priority at response
              </span>
              <TicketPriorityBadge priority={responseData.priorityAtResponse} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Deadline</span>
              <span className="font-medium tabular-nums text-foreground text-xs">
                {responseData.deadline
                  ? format(responseData.deadline, "dd/MM HH:mm")
                  : "—"}
              </span>
            </div>

            {!responseData.hasResponded && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    Remaining
                  </span>
                  <span className="font-medium tabular-nums text-foreground text-xs">
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
              <span className="text-muted-foreground text-xs">
                Responded at
              </span>
              <span className="font-medium tabular-nums text-foreground text-xs">
                {responseData.hasResponded && responseData.firstRespondedAt
                  ? format(responseData.firstRespondedAt, "dd/MM HH:mm")
                  : "—"}
              </span>
            </div>

            {responseData.hasResponded &&
              responseData.isOverdue &&
              responseData.overdueMs > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Late by</span>
                  <span className="font-medium tabular-nums text-destructive text-xs">
                    {formatDurationHuman(responseData.overdueMs)}
                  </span>
                </div>
              )}

            {responseData.hasResponded &&
              !responseData.isOverdue &&
              responseData.durationMs > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">
                    Response time
                  </span>
                  <span className="font-medium tabular-nums text-foreground text-xs">
                    {formatDurationHuman(responseData.durationMs)}
                  </span>
                </div>
              )}
          </div>
        )}
      </div>

      {/* ── STAGE 2: RESOLUTION SLA ─────────────────────────────────────── */}
      <div className="space-y-2.5 -mx-4 px-4 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-semibold text-foreground"
            onClick={() => setResolutionExpanded((v) => !v)}
          >
            {resolutionExpanded ? (
              <ChevronDown
                size={14}
                className="shrink-0 text-muted-foreground"
              />
            ) : (
              <ChevronRight
                size={14}
                className="shrink-0 text-muted-foreground"
              />
            )}
            2. Resolution SLA
          </button>
          {isOpenStage ? (
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${toneClass("muted")}`}
            >
              Not started
            </span>
          ) : (
            <SlaCountdown
              slaTimer={slaTimer}
              compact
              completedAt={
                ticket.status === TicketStatusEnum.Completed ||
                ticket.status === TicketStatusEnum.Closed ||
                ticket.status === TicketStatusEnum.ClosedRejected
                  ? ((ticket as TicketDetailDTO).resolvedAt ??
                    (ticket as TicketDetailDTO).closedAt)
                  : null
              }
            />
          )}
        </div>

        {resolutionExpanded &&
          (isOpenStage ? (
            <div className="py-2 text-center text-xs text-muted-foreground">
              Resolution SLA starts once the ticket is assigned and moved to
              InProgress.
            </div>
          ) : slaTimer ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  Current priority
                </span>
                <TicketPriorityBadge priority={ticket.priority} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Deadline</span>
                <span className="font-medium tabular-nums text-foreground text-xs">
                  {format(new Date(slaTimer.dueAt), "dd/MM HH:mm")}
                </span>
              </div>

              {calendarExtensionLabel && (
                <div className="text-xs text-muted-foreground">
                  <p className="italic">{calendarExtensionLabel}:</p>
                  {calendarExtensionDays.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {calendarExtensionDays.map((day) => (
                        <li key={day} className="font-bold not-italic">
                          - {day}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {isResolutionLive && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      Remaining
                    </span>
                    <span className="font-medium tabular-nums text-foreground text-xs">
                      {resolutionPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width,background-color] duration-(--motion-enter) ease-linear ${resolutionBarCls}`}
                      style={{
                        width: `${Math.max(0, resolutionPercent)}%`,
                      }}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">
                  Resolved at
                </span>
                <span className="font-medium tabular-nums text-foreground text-xs">
                  {(ticket as TicketDetailDTO).resolvedAt
                    ? format(
                        new Date((ticket as TicketDetailDTO).resolvedAt!),
                        "dd/MM HH:mm",
                      )
                    : "—"}
                </span>
              </div>

              {slaTimer.status === SlaTimerStatusEnum.Breached &&
                (slaTimer.rescueRemainingMinutes != null &&
                slaTimer.rescueRemainingMinutes > 0 ? (
                  <div className="text-sm text-destructive font-medium">
                    Overdue — {Math.floor(slaTimer.rescueRemainingMinutes / 60)}
                    h
                    {slaTimer.rescueRemainingMinutes % 60 > 0
                      ? ` ${slaTimer.rescueRemainingMinutes % 60}m`
                      : ""}{" "}
                    until auto-escalation.
                  </div>
                ) : (
                  <div className="text-sm text-destructive font-medium">
                    SLA deadline breached.
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-muted-foreground">
              No Resolution SLA configured for this ticket.
            </div>
          ))}
      </div>
    </div>
  );
}
