import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { ArrowLeft, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  getPrimaryHandlerName,
  getSupporterNames,
} from "@/shared/utils/ticket/assignments";
import { TicketStatusEnum } from "@/shared/types/ticket/ticket.types";
import { slaBarColorClass } from "@/shared/lib/sla";
import { ESCALATION_REASON_LABEL } from "@/shared/constants/ticketLabels";
import type { MaintenanceLogDTO } from "@/shared/types/ticket/ticket.types";
import {
  useStaffTicketDetail,
  useStaffTicketActivities,
  useStaffTicketComments,
} from "@/features/staff/hooks/ticket/useStaffTicketDetail";
import {
  useHoldTicket,
  useResumeTicket,
  useCompleteTicket,
  useEscalateTicket,
  useAddMaintenanceLog,
} from "@/features/staff/hooks/ticket/useStaffTicketMutations";
import { staffTicketService } from "@/features/staff/services/ticket/ticket.service";
import { useChatSender } from "@/shared/hooks/ticket/useChatSender";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TypingIndicator from "@/shared/components/chat/TypingIndicator";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import { SlaCountdown } from "@/features/staff/components/ticket/SlaCountdown";
import { HoldDialog } from "@/features/staff/components/ticket/HoldDialog";
import { ResolveDialog } from "@/features/staff/components/ticket/ResolveDialog";
import { EscalateRequestDialog } from "@/features/staff/components/ticket/EscalateRequestDialog";
import TicketActivityTimeline from "@/shared/components/ticket/TicketActivityTimeline";
import { AddCommentForm } from "@/features/staff/components/ticket/AddCommentForm";
import { MaintenanceLogDialog } from "@/features/staff/components/ticket/MaintenanceLogDialog";
import { EditMaintenanceLogDialog } from "@/features/staff/components/ticket/EditMaintenanceLogDialog";
import TicketAttachments from "@/shared/components/ticket/TicketAttachments";
import TicketVerifyBadge from "@/shared/components/ticket/TicketVerifyBadge";
import ChatUnreadBadge from "@/shared/components/ticket/ChatUnreadBadge";
import {
  TicketCommentThread,
  type ChatTab,
} from "@/shared/components/ticket/TicketCommentThread";
import { ProcessingDurationTimer } from "@/shared/components/ticket/ProcessingDurationTimer";
import TicketKbReferencesPanel from "@/features/staff/components/ticket/TicketKbReferencesPanel";
import SubIssuePanel from "@/features/staff/components/ticket/SubIssuePanel";
import BatteryAssetInfoPanel from "@/features/staff/components/battery/BatteryAssetInfoPanel";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { useTicketCommentsRealtime } from "@/shared/hooks/ticket/useTicketCommentsRealtime";
import { useMentionCandidates } from "@/shared/hooks/ticket/useTicketParticipants";
import {
  useUpdateTicketChat,
  useDeleteTicketChat,
  useMarkTicketChatsRead,
  useTranslateTicketChat,
} from "@/shared/hooks/ticket/useTicketChatActions";
import type { HoldFormValues } from "@/features/staff/schemas/ticket/staff-ticket.schema";
import type { ResolveFormValues } from "@/features/staff/schemas/ticket/staff-ticket.schema";
import type { EscalateRequestFormValues } from "@/features/staff/schemas/ticket/staff-ticket.schema";
import type { AddCommentFormValues } from "@/features/staff/schemas/ticket/staff-ticket.schema";
import type { MaintenanceLogFormValues } from "@/features/staff/schemas/ticket/staff-ticket.schema";

// GH-1176: removed legacy WaitingCustomer/WaitingParts/WaitingOnsiteSchedule statuses.

function SideInfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right">
        {value ?? <span className="text-muted-foreground/50">—</span>}
      </span>
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [holdOpen, setHoldOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLogDTO | null>(null);
  // Chat tab: new comments are sent under whichever tab is active (public/internal).
  const [chatTab, setChatTab] = useState<ChatTab>("public");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [composerPrefill, setComposerPrefill] = useState({
    text: "",
    version: 0,
  });

  const ticketId = id ?? "";
  const user = useSessionStore((s) => s.user);
  const currentUserId = user?.accountId;

  // Realtime: invalidates tickets.chats on ChatAdded (same key as useStaffTicketComments)
  // + typing indicator (typingNames renders "is typing", sendTyping reports when we type).
  const { typingNames, sendTyping } = useTicketCommentsRealtime(ticketId);

  const { data: ticket, isLoading, isError } = useStaffTicketDetail(ticketId);
  // Handler's name — taken directly from assignments (BE already includes staffName).
  const primaryHandlerName = getPrimaryHandlerName(ticket?.assignments);
  const supporterNames = getSupporterNames(ticket?.assignments);
  const { data: activities = [], isLoading: activitiesLoading } =
    useStaffTicketActivities(ticketId);
  const { data: comments = [] } = useStaffTicketComments(ticketId);

  const existingFileIds = useMemo(() => {
    const ids = new Set<string>();
    if (ticket?.attachmentFileIds) {
      ticket.attachmentFileIds.forEach((id) => ids.add(id));
    }
    if (ticket?.maintenanceLogs) {
      ticket.maintenanceLogs.forEach((log) => {
        log.attachmentFileIds?.forEach((id) => ids.add(id));
        log.beforePhotosFileIds?.forEach((id) => ids.add(id));
        log.afterPhotosFileIds?.forEach((id) => ids.add(id));
      });
    }
    comments.forEach((c) => {
      c.attachmentFileIds?.forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [ticket, comments]);

  // People who can be @-tagged: active participants of the ticket (GET .../participants).
  // Does NOT use chat authors — someone newly added to the ticket who hasn't chatted yet
  // must still be taggable.
  const mentionCandidates = useMentionCandidates(ticketId);

  // GH-1176: startMutation now calls resume (early resume for Held tickets only).
  const holdMutation = useHoldTicket(ticketId);
  const resumeMutationForHeld = useResumeTicket(ticketId);
  const completeMutation = useCompleteTicket(ticketId);
  const escalateMutation = useEscalateTicket(ticketId);
  // Outbox chat: a worker sends sequentially + retries; the composer only enqueues.
  const {
    pending: pendingChats,
    enqueue: enqueueChat,
    retry: retryChat,
    discard: discardChat,
  } = useChatSender(ticketId, staffTicketService.addComment);
  const logMutation = useAddMaintenanceLog(ticketId);
  const { mutate: updateChat, isPending: editChatPending } =
    useUpdateTicketChat();
  const { mutate: deleteChat, isPending: deleteChatPending } =
    useDeleteTicketChat();
  const { mutate: markChatsRead } = useMarkTicketChatsRead();
  const handleMarkRead = (chatIds: string[]) =>
    markChatsRead({ ticketId, payload: { chatIds } });
  const { mutateAsync: translateChat } = useTranslateTicketChat();
  const handleTranslate = (chat: { id: string }, targetLanguage: string) =>
    translateChat({ ticketId, chatId: chat.id, targetLanguage });

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive mb-4">
          Ticket not found, or you don't have access.
        </p>
        <Button variant="outline" onClick={() => navigate("/staff/tickets")}>
          Back to list
        </Button>
      </div>
    );
  }

  if (isLoading || !ticket) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-[calc(100vh-150px)] w-full rounded-xl" />
      </div>
    );
  }

  const { status } = ticket;
  const isInProgress = status === TicketStatusEnum.InProgress;
  const isPending = status === TicketStatusEnum.Pending;
  // GH-1176: Staff can comment while InProgress or Pending (held).
  const canComment = isInProgress || isPending;
  const canAddLog = isInProgress;
  const canEditLog = isInProgress;
  // GH-1176: KB references blocked once Completed or terminal.
  const canAddKb = !(
    [
      TicketStatusEnum.Completed,
      TicketStatusEnum.Closed,
      TicketStatusEnum.ClosedRejected,
    ] as TicketStatusEnum[]
  ).includes(status);
  const kbAfterResolveOnly = status === TicketStatusEnum.Completed;

  const handleHoldSubmit = (data: HoldFormValues) => {
    holdMutation.mutate(
      {
        ...data,
        rescheduledStartAtUtc: new Date(
          data.rescheduledStartAtUtc,
        ).toISOString(),
      },
      { onSuccess: () => setHoldOpen(false) },
    );
  };

  const handleResolveSubmit = (data: ResolveFormValues) => {
    completeMutation.mutate(data, { onSuccess: () => setResolveOpen(false) });
  };

  const handleEscalateSubmit = (data: EscalateRequestFormValues) => {
    escalateMutation.mutate(data, { onSuccess: () => setEscalateOpen(false) });
  };

  const handleCommentSubmit = (data: AddCommentFormValues) => {
    enqueueChat(data);
  };

  const handleLogSubmit = (data: MaintenanceLogFormValues) => {
    logMutation.mutate(data, { onSuccess: () => setLogOpen(false) });
  };

  const logs = ticket.maintenanceLogs ?? [];

  const slaBarCls = slaBarColorClass(ticket.slaTimer?.remainingPercent);

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-3 shrink-0 border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="-ml-1 shrink-0"
            onClick={() => navigate("/staff/tickets")}
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground">
                {ticket.code}
              </span>
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
              {ticket.isIncident && (
                <Badge variant="destructive" className="text-xs">
                  Incident
                </Badge>
              )}
            </div>
            <h1
              className="text-base font-semibold truncate leading-tight mt-0.5"
              title={ticket.title}
            >
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <RefreshButton
            queryKeys={[KEY.staffTickets, KEY.tickets]}
            size="icon"
          />
          {/* GH-1176: unrestricted start removed; early resume is shown for Held tickets only */}
          {isPending && ticket.pendingContext === "Held" && (
            <Button
              size="sm"
              onClick={() => resumeMutationForHeld.mutate(undefined)}
              disabled={resumeMutationForHeld.isPending}
            >
              {resumeMutationForHeld.isPending
                ? "Processing..."
                : "Resume early"}
            </Button>
          )}
          {isInProgress && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHoldOpen(true)}
              >
                Hold
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResolveOpen(true)}
              >
                Report resolution
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEscalateOpen(true)}
              >
                Request escalation
              </Button>
            </>
          )}
          {/* GH-1176: resume is handled by the resumeMutationForHeld button above for Held tickets. */}
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Tabs */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          <Tabs defaultValue="info" className="h-full gap-0">
            <div className="px-6 py-2.5 border-b border-border shrink-0">
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                {/* `group` so ChatUnreadBadge auto-hides while this tab is active. */}
                <TabsTrigger value="comments" className="group">
                  Chat
                  <ChatUnreadBadge ticketId={id ?? ""} />
                </TabsTrigger>
                <TabsTrigger value="logs">
                  Logs{logs.length > 0 && ` (${logs.length})`}
                </TabsTrigger>
                <TabsTrigger value="sub-issues">Sub Issue</TabsTrigger>
                <TabsTrigger value="kb">Guide</TabsTrigger>
              </TabsList>
            </div>

            {/* Info — battery asset info + attachments (matches Manager's "Info" tab) */}
            <TabsContent
              value="info"
              className="min-h-0 overflow-y-auto m-0 p-6 space-y-6"
            >
              {/* A ticket can have multiple batteries attached — iterate each one. Fallback to a single battery (legacy). */}
              {(() => {
                const ids =
                  ticket.batteryAssetIds && ticket.batteryAssetIds.length > 0
                    ? ticket.batteryAssetIds
                    : ticket.batteryAssetId
                      ? [ticket.batteryAssetId]
                      : [];
                if (ids.length === 0)
                  return <BatteryAssetInfoPanel batteryAssetId={null} />;
                return (
                  <div className="space-y-4">
                    {ids.length > 1 && (
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {ids.length} related batteries
                      </p>
                    )}
                    {ids.map((bid) => (
                      <BatteryAssetInfoPanel
                        key={bid}
                        batteryAssetId={bid}
                        detectedAt={ticket.detectedAt}
                      />
                    ))}
                  </div>
                );
              })()}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Attachments
                </p>
                {ticket.attachmentFileIds &&
                ticket.attachmentFileIds.length > 0 ? (
                  <TicketAttachments fileIds={ticket.attachmentFileIds} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No attachments.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Timeline */}
            <TabsContent
              value="timeline"
              className="min-h-0 overflow-y-auto m-0 p-6"
            >
              {activitiesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <TicketActivityTimeline
                  activities={activities}
                  assignments={ticket.assignments}
                />
              )}
            </TabsContent>

            {/* Comments */}
            <TabsContent
              value="comments"
              className="min-h-0 m-0 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-6">
                <TicketCommentThread
                  comments={comments}
                  currentUserId={currentUserId}
                  activeTab={chatTab}
                  onTabChange={setChatTab}
                  ticketClosed={status === TicketStatusEnum.Closed}
                  ticketId={ticketId}
                  aiEnabled
                  onSelectSuggestion={(text) => {
                    if (!canComment) return;
                    setComposerPrefill((prev) => ({
                      text,
                      version: prev.version + 1,
                    }));
                  }}
                  onEdit={(chat, body) =>
                    updateChat({
                      ticketId,
                      chatId: chat.id,
                      payload: { body },
                    })
                  }
                  onDelete={(chat) => deleteChat({ ticketId, chatId: chat.id })}
                  editPending={editChatPending}
                  deletePending={deleteChatPending}
                  onMarkRead={handleMarkRead}
                  onTranslate={handleTranslate}
                  pendingMessages={pendingChats}
                  onRetryPending={retryChat}
                  onDiscardPending={discardChat}
                />
              </div>
              {canComment && (
                <div className="shrink-0 border-t border-border p-3">
                  <TypingIndicator names={typingNames} />
                  <AddCommentForm
                    ticketId={ticketId}
                    onSubmit={handleCommentSubmit}
                    isPending={false}
                    onTyping={sendTyping}
                    isInternal={chatTab === "internal"}
                    existingFileIds={existingFileIds}
                    prefillText={composerPrefill.text}
                    prefillVersion={composerPrefill.version}
                    mentionCandidates={mentionCandidates}
                  />
                </div>
              )}
            </TabsContent>

            {/* Maintenance logs */}
            <TabsContent
              value="logs"
              className="min-h-0 overflow-y-auto m-0 p-6 space-y-4"
            >
              {canAddLog && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLogOpen(true)}
                  >
                    + Add log
                  </Button>
                </div>
              )}
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No maintenance logs yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-border rounded-lg p-4 space-y-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline">{log.logType}</Badge>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {format(
                              new Date(log.startedAt),
                              "MM/dd/yyyy HH:mm",
                              { locale: enUS },
                            )}
                          </p>
                          {canEditLog && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setEditingLog(log)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                      {log.summary && (
                        <p className="font-medium">{log.summary}</p>
                      )}
                      {log.diagnosisDetails && (
                        <p className="text-muted-foreground">
                          Diagnosis: {log.diagnosisDetails}
                        </p>
                      )}
                      {log.actionsTaken && (
                        <p className="text-muted-foreground">
                          Actions: {log.actionsTaken}
                        </p>
                      )}
                      {log.durationMinutes > 0 && (
                        <p className="text-muted-foreground">
                          Duration: {log.durationMinutes} min
                        </p>
                      )}
                      {log.attachmentFileIds &&
                        log.attachmentFileIds.length > 0 && (
                          <TicketAttachments
                            fileIds={log.attachmentFileIds}
                            label="Attached photos"
                            compact
                          />
                        )}
                      {log.beforePhotosFileIds &&
                        log.beforePhotosFileIds.length > 0 && (
                          <TicketAttachments
                            fileIds={log.beforePhotosFileIds}
                            label="Before photos"
                            compact
                          />
                        )}
                      {log.afterPhotosFileIds &&
                        log.afterPhotosFileIds.length > 0 && (
                          <TicketAttachments
                            fileIds={log.afterPhotosFileIds}
                            label="After photos"
                            compact
                          />
                        )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Sub Issue — staff break the ticket down into smaller tasks themselves */}
            <TabsContent
              value="sub-issues"
              className="min-h-0 overflow-y-auto m-0 p-6"
            >
              <SubIssuePanel key={ticketId} ticketId={ticketId} />
            </TabsContent>

            {/* KB */}
            <TabsContent value="kb" className="min-h-0 overflow-y-auto m-0 p-6">
              <TicketKbReferencesPanel
                ticketId={ticketId}
                canAdd={canAddKb}
                afterResolveOnly={kbAfterResolveOnly}
                defaultCategory={ticket.category}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Sidebar — always mounted, animates width (matches the left sidebar) */}
        <aside
          className={cn(
            "shrink-0 border-l border-border overflow-hidden",
            sidebarOpen ? "w-75" : "w-8",
          )}
        >
          {/* Collapsed rail — button to reopen the info panel */}
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              title="Open info panel"
              className="w-8 h-full flex items-start justify-center pt-4 text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <PanelRightOpen className="size-4" />
            </button>
          )}

          {/* Panel content — only shown when open; fixed width w-75 so it doesn't reflow while sliding */}
          {sidebarOpen && (
            <div className="w-75 h-full overflow-y-auto flex flex-col divide-y divide-border/60">
              {/* Header — collapse button */}
              <div className="flex items-center justify-between px-4 py-2 shrink-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Info
                </p>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  title="Collapse info panel"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <PanelRightClose className="size-4" />
                </button>
              </div>

              {/* ── AI check + suspected duplicate (only for tickets manually created by a Customer) ──
                  Matches the Manager sidebar. Staff only READS the AI's assessment —
                  the "Re-check AI" and "Merge ticket" buttons are Manager triage
                  permissions, so they aren't carried over here. */}
              {ticket.origin === "ManualByCustomer" &&
                (ticket.aiVerifyStatus ||
                  ticket.suspectedDuplicateOfTicketId) && (
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      AI check
                    </p>
                    {ticket.aiVerifyStatus && (
                      <div className="flex items-center gap-2">
                        <TicketVerifyBadge
                          status={ticket.aiVerifyStatus}
                          origin={ticket.origin}
                        />
                        {ticket.aiVerifyScore != null && (
                          <span className="text-xs text-muted-foreground">
                            {(ticket.aiVerifyScore * 100).toFixed(0)}% valid
                          </span>
                        )}
                      </div>
                    )}
                    {ticket.aiVerifyReason && (
                      <p className="text-xs text-muted-foreground">
                        {ticket.aiVerifyReason}
                      </p>
                    )}
                    {ticket.suspectedDuplicateOfTicketId && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                        <p className="font-medium">
                          ⚠ Suspected duplicate of another ticket
                        </p>
                        {ticket.duplicateReason && (
                          <p className="mt-0.5">{ticket.duplicateReason}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

              {/* SLA */}
              <div className="p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  SLA
                </p>
                {ticket.slaTimer ? (
                  <div className="space-y-2.5">
                    {/* Single-line chip clock — MATCHES Manager. A multi-line version with its
                        own progress bar would give the SLA block 2 bars drawing the same
                        ratio (the small one here + the "remaining" bar below). */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Status
                      </span>
                      <SlaCountdown
                        slaTimer={ticket.slaTimer}
                        hideBar
                        compact
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Deadline
                      </span>
                      <span className="text-xs font-medium tabular-nums">
                        {format(new Date(ticket.slaTimer.dueAt), "MM/dd HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Remaining
                      </span>
                      <span className="text-xs font-medium">
                        {ticket.slaTimer.remainingPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${slaBarCls}`}
                        style={{
                          width: `${Math.max(0, ticket.slaTimer.remainingPercent)}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Not triaged yet.
                  </p>
                )}
              </div>

              {/* Processing time.
                  Dropped a "Current status" badge row: the badge already sits right next to
                  the ticket code in the page header, so adding it here would repeat the same
                  info twice. The "Status" label in the SLA block above is the SLA countdown —
                  a completely different meaning, so merging the two blocks would only confuse. */}
              <div className="p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Processing time
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Elapsed</span>
                  <ProcessingDurationTimer
                    activities={activities}
                    status={ticket.status}
                  />
                </div>
              </div>

              {/* Battery asset info moved to the "Info" tab (matches Manager) —
                  keeping it in both places would render the same battery panel + evidence twice. */}

              {/* Description */}
              {ticket.description && (
                <div className="p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Description
                  </p>
                  <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>
              )}

              {/* Attachments (photos the customer attached when creating the ticket) */}
              {ticket.attachmentFileIds &&
                ticket.attachmentFileIds.length > 0 && (
                  <div className="p-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Attached photos
                    </p>
                    <TicketAttachments
                      fileIds={ticket.attachmentFileIds}
                      label={null}
                      compact
                    />
                  </div>
                )}

              {/* Rejection reason */}
              {ticket.rejectionReason && (
                <div className="p-4">
                  <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider mb-2">
                    Rejection reason
                  </p>
                  <p className="text-xs leading-relaxed">
                    {ticket.rejectionReason}
                  </p>
                </div>
              )}

              {/* Resolution */}
              {ticket.resolutionSummary && (
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10">
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
                    Resolution
                  </p>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap mb-2">
                    {ticket.resolutionSummary}
                  </p>
                  {ticket.resolvedAt && (
                    <p className="text-[10.5px] text-emerald-700/70 dark:text-emerald-400/70">
                      Resolved at{" "}
                      {format(new Date(ticket.resolvedAt), "MM/dd/yyyy HH:mm", {
                        locale: enUS,
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Escalation */}
              {ticket.escalatedAt && (
                <div className="p-4 bg-orange-50/50 dark:bg-orange-950/10">
                  <p className="text-[10px] font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-2">
                    Escalation
                  </p>
                  {ticket.escalationReason && (
                    <p className="text-xs leading-relaxed">
                      {ESCALATION_REASON_LABEL[ticket.escalationReason] ??
                        ticket.escalationReason}
                    </p>
                  )}
                  <p className="text-[10.5px] text-orange-700/70 dark:text-orange-400/70 mt-1">
                    {format(new Date(ticket.escalatedAt), "MM/dd/yyyy HH:mm", {
                      locale: enUS,
                    })}
                  </p>
                </div>
              )}

              {/* Customer rating */}
              {ticket.rating != null && (
                <div className="p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Customer rating
                  </p>
                  <p className="text-xs font-medium">
                    {"★".repeat(ticket.rating)}
                    {"☆".repeat(5 - ticket.rating)}
                    <span className="text-muted-foreground font-normal ml-1">
                      ({ticket.rating}/5)
                    </span>
                  </p>
                  {ticket.ratingComment && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {ticket.ratingComment}
                    </p>
                  )}
                </div>
              )}

              {/* Meta */}
              <div className="px-4 py-1 divide-y divide-border/50">
                <SideInfoRow label="Category" value={ticket.category} />
                <SideInfoRow label="Origin" value={ticket.origin} />
                {/* Who's handling it — the BE returns staffName, so every role can read it
                    without calling /api/staff (that endpoint is only open to Admin/Manager). */}
                <SideInfoRow
                  label="Primary handler"
                  value={primaryHandlerName}
                />
                {supporterNames.length > 0 && (
                  <SideInfoRow
                    label="Supporters"
                    value={
                      <span className="flex flex-wrap justify-end gap-1">
                        {supporterNames.map((name) => (
                          <Badge key={name} variant="secondary">
                            {name}
                          </Badge>
                        ))}
                      </span>
                    }
                  />
                )}
                {/* GH-866 — 1 detection timestamp (replaces the old from/to pair). */}
                {ticket.detectedAt && (
                  <SideInfoRow
                    label="Detected at"
                    value={format(
                      new Date(ticket.detectedAt),
                      "MM/dd/yyyy HH:mm",
                      { locale: enUS },
                    )}
                  />
                )}
                <SideInfoRow label="Scope" value={ticket.impactScope ?? null} />
                <SideInfoRow
                  label="Urgency"
                  value={ticket.urgencyLevel ?? null}
                />
                <SideInfoRow
                  label="Created"
                  value={format(
                    new Date(ticket.createdAt),
                    "MM/dd/yyyy HH:mm",
                    {
                      locale: enUS,
                    },
                  )}
                />
                {ticket.reopenCount > 0 && (
                  <SideInfoRow
                    label="Reopened"
                    value={`${ticket.reopenCount} times`}
                  />
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      <HoldDialog
        open={holdOpen}
        onClose={() => setHoldOpen(false)}
        onSubmit={handleHoldSubmit}
        isPending={holdMutation.isPending}
      />
      <ResolveDialog
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        onSubmit={handleResolveSubmit}
        isPending={completeMutation.isPending}
      />
      <EscalateRequestDialog
        open={escalateOpen}
        onClose={() => setEscalateOpen(false)}
        onSubmit={handleEscalateSubmit}
        isPending={escalateMutation.isPending}
      />
      <MaintenanceLogDialog
        open={logOpen}
        onClose={() => setLogOpen(false)}
        onSubmit={handleLogSubmit}
        isPending={logMutation.isPending}
      />
      {editingLog && (
        <EditMaintenanceLogDialog
          ticketId={ticketId}
          log={editingLog}
          open
          onClose={() => setEditingLog(null)}
        />
      )}
    </div>
  );
}
