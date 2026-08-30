import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { ArrowLeft, Lock, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPrimaryHandler,
  getPrimaryHandlerName,
  getSupporterNames,
  getPreviousPrimaryHandlerNames,
} from "@/shared/utils/ticket/assignments";
import {
  TicketStatusEnum,
  MaintenanceLogTypeEnum,
} from "@/shared/types/ticket/ticket.types";
import { slaBarColorClass, isSlaClockLive } from "@/shared/lib/sla";
import {
  isTicketChatLocked,
  ticketChatLockedNotice,
} from "@/shared/utils/ticket.utils";
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
import ChatUnreadBadge from "@/shared/components/ticket/ChatUnreadBadge";
import TypingIndicator from "@/shared/components/chat/TypingIndicator";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import { SlaCountdown } from "@/features/staff/components/ticket/SlaCountdown";
import { HoldDialog } from "@/features/staff/components/ticket/HoldDialog";
import { ResumeDialog } from "@/features/staff/components/ticket/ResumeDialog";
import { EscalateRequestDialog } from "@/features/staff/components/ticket/EscalateRequestDialog";
import TicketActivityTimeline from "@/shared/components/ticket/TicketActivityTimeline";
import { AddCommentForm } from "@/features/staff/components/ticket/AddCommentForm";
import { MaintenanceLogDialog } from "@/features/staff/components/ticket/MaintenanceLogDialog";
import { EditMaintenanceLogDialog } from "@/features/staff/components/ticket/EditMaintenanceLogDialog";
import TicketAttachments from "@/shared/components/ticket/TicketAttachments";
import MaintenanceLogCard from "@/shared/components/ticket/MaintenanceLogCard";
import TicketVerifyBadge from "@/shared/components/ticket/TicketVerifyBadge";
import {
  TicketCommentThread,
  type ChatTab,
} from "@/shared/components/ticket/TicketCommentThread";
import { ProcessingDurationTimer } from "@/shared/components/ticket/ProcessingDurationTimer";
import TicketKbReferencesPanel from "@/shared/components/ticket/TicketKbReferencesPanel";
import SubIssuePanel from "@/features/staff/components/ticket/SubIssuePanel";
import BatteryAssetInfoPanel from "@/features/staff/components/battery/BatteryAssetInfoPanel";
import EnvironmentalIncidentInfoPanel from "@/shared/components/ticket/EnvironmentalIncidentInfoPanel";
import { getTicketSubject } from "@/shared/lib/ticketSubject";
import TicketBmsAction from "@/shared/components/ticket/TicketBmsAction";
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
import type { ResumeFormValues } from "@/features/staff/schemas/ticket/staff-ticket.schema";
import type { EscalateRequestFormValues } from "@/features/staff/schemas/ticket/staff-ticket.schema";
import type { AddCommentFormValues } from "@/features/staff/schemas/ticket/staff-ticket.schema";
import type { MaintenanceLogFormValues } from "@/features/staff/schemas/ticket/staff-ticket.schema";
import { staffKbService } from "@/features/staff/services/kb/kb.service";
import type { KbArticleSearchParams } from "@/shared/components/kb/KbArticleSelector";

// Article lookups stay with the role's own KB service: Manager's carries the
// approve/publish workflow that Staff's does not, and shared must not import from a
// feature. The panel only needs these two reads.
const searchKbArticles = ({ q, category }: KbArticleSearchParams) =>
  staffKbService
    .getList({
      q,
      category: category ? KbCategoryCode[category] : undefined,
      status: KbArticleStatusEnum.Published,
      pageSize: 20,
    })
    .then((r) => r.data.data?.items ?? []);

const getKbArticleDetail = (id: string) =>
  staffKbService.getDetail(id).then((r) => r.data.data!);

import { KbArticleStatusEnum, KbCategoryCode } from "@/shared/enums/kb/kb.enum";

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
  const [resumeOpen, setResumeOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  // Complete requires a maintenance log first — this dialog is reused for that flow
  // (see handleCompleteLogSubmit below); the standalone "+ Add log" button never sets this.
  const [completeLogOpen, setCompleteLogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLogDTO | null>(null);
  // Chat tab: new comments are sent under whichever tab is active (public/internal).
  const [chatTab, setChatTab] = useState<ChatTab>("public");
  // Which outer tab is open. The chat query must NOT run until the user actually opens
  // the Chat tab: GET /chats auto-marks every message it returns as read on the BE, so
  // fetching it eagerly told the sender "seen" for a thread nobody had looked at.
  const [mainTab, setMainTab] = useState("info");
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
  const { typingNames, sendTyping, pinNotices } =
    useTicketCommentsRealtime(ticketId);

  const { data: ticket, isLoading, isError } = useStaffTicketDetail(ticketId);
  // Handler's name — taken directly from assignments (BE already includes staffName).
  const primaryHandlerName = getPrimaryHandlerName(ticket?.assignments);
  const supporterNames = getSupporterNames(ticket?.assignments);
  const previousPrimaryHandlerNames = getPreviousPrimaryHandlerNames(
    ticket?.assignments,
  );
  const { data: activities = [], isLoading: activitiesLoading } =
    useStaffTicketActivities(ticketId);
  const { data: comments = [] } = useStaffTicketComments(
    ticketId,
    mainTab === "comments",
  );

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
  const handleMarkRead = (chatIds: string[], onFailed: () => void) =>
    markChatsRead({ ticketId, payload: { chatIds }, onFailed });
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
      <PageContainer className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-[calc(100vh-150px)] w-full rounded-xl" />
      </PageContainer>
    );
  }

  const { status } = ticket;
  const isInProgress = status === TicketStatusEnum.InProgress;
  const isPending = status === TicketStatusEnum.Pending;
  // GH-1176: Staff can comment while InProgress or Pending (held).
  const canComment = isInProgress || isPending;
  // Only the current PrimaryHandler and Manager/Admin may post on the public channel.
  // Supporter and PreviousPrimaryHandler may only view public — composer hidden on that tab for
  // them (BE also enforces this — ChatAddCommandHandler returns 403 — this just avoids the
  // round trip). Manager/Admin aren't in ticket.assignments, so allow them unconditionally.
  const isPrimaryHandler =
    getPrimaryHandler(ticket.assignments)?.staffId === currentUserId;
  const canPostPublic =
    user?.role === "MANAGER" || user?.role === "ADMIN" || isPrimaryHandler;
  const canAddLog = isInProgress;
  const canEditLog = isInProgress;
  // Ticket finished → chat is archived: edit/delete locked and the composer replaced by a
  // notice. Distinct from !canComment, which is also false mid-lifecycle (e.g. Open) — the
  // composer is simply absent there, with no "closed" claim to make about it.
  const chatLocked = isTicketChatLocked(status);
  // GH-1176: KB references blocked once Completed or terminal.
  const canAddKb = !chatLocked;
  const kbAfterResolveOnly = status === TicketStatusEnum.Completed;

  const handleHoldSubmit = (data: HoldFormValues) =>
    holdMutation
      .mutateAsync({
        ...data,
        rescheduledStartAt: new Date(data.rescheduledStartAt).toISOString(),
      })
      .then(() => setHoldOpen(false));

  const handleResumeSubmit = (data: ResumeFormValues) =>
    resumeMutationForHeld.mutateAsync(data).then(() => setResumeOpen(false));

  const handleEscalateSubmit = (data: EscalateRequestFormValues) =>
    escalateMutation.mutateAsync(data).then(() => setEscalateOpen(false));

  const handleCommentSubmit = (data: AddCommentFormValues) => {
    enqueueChat(data);
  };

  const handleLogSubmit = (data: MaintenanceLogFormValues) =>
    // BE requires StartedAt (TicketService.MaintenanceLogAddCommand.ValidateAsync) — the form
    // has no dedicated input for it, so stamp "now" at submit time.
    logMutation
      .mutateAsync({ ...data, startedAt: new Date().toISOString() })
      .then(() => setLogOpen(false));

  // Complete requires a maintenance log first: save the log, then use its own summary as
  // the ticket's resolutionSummary — no separate "describe the resolution" step.
  const handleCompleteLogSubmit = (data: MaintenanceLogFormValues) =>
    logMutation
      .mutateAsync({ ...data, startedAt: new Date().toISOString() })
      .then(() =>
        completeMutation.mutateAsync({ resolutionSummary: data.summary }),
      )
      .then(() => setCompleteLogOpen(false));

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
          {/* Cutting charge/discharge is the first move on a thermal or overcharge ticket, so it
              sits with the other header actions rather than a screen away. Picks battery vs
              whole-site itself, and hides once the ticket is finished. */}
          <TicketBmsAction ticket={ticket} />
          {/* GH-1176: unrestricted start removed; early resume is shown for Held tickets only */}
          {isPending && ticket.pendingContext === "Held" && (
            <Button
              size="sm"
              onClick={() => setResumeOpen(true)}
              disabled={resumeMutationForHeld.isPending}
            >
              {resumeMutationForHeld.isPending ? "Processing..." : "Resume"}
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
              <Button size="sm" onClick={() => setCompleteLogOpen(true)}>
                Complete
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
          <RefreshButton queryKeys={[KEY.staffTickets, KEY.tickets]} />
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Tabs */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          <Tabs
            value={mainTab}
            onValueChange={setMainTab}
            className="h-full gap-0"
          >
            <div className="px-6 py-2.5 border-b border-border shrink-0">
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="comments" className="group">
                  Chat
                  <ChatUnreadBadge ticketId={ticketId} />
                </TabsTrigger>
                <TabsTrigger value="logs">
                  Logs{logs.length > 0 && ` (${logs.length})`}
                </TabsTrigger>
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
                // Same classification as the Manager page — see getTicketSubject for why
                // "site" must be checked before the empty-battery fallback.
                // No siteBasePath: Staff has no sites/:id route, so the readings render
                // inline in the panel instead of behind a link.
                const subject = getTicketSubject(ticket);
                if (subject.kind === "site")
                  return (
                    <EnvironmentalIncidentInfoPanel
                      incidentId={subject.incidentId}
                      description={ticket.description}
                    />
                  );
                const ids =
                  subject.kind === "battery" ? subject.batteryAssetIds : [];
                if (ids.length === 0)
                  return <BatteryAssetInfoPanel batteryAssetId={null} />;
                return (
                  <div className="space-y-4">
                    {ids.length > 1 && (
                      <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
                  pinNotices={pinNotices}
                  comments={comments}
                  currentUserId={currentUserId}
                  activeTab={chatTab}
                  onTabChange={setChatTab}
                  ticketClosed={chatLocked}
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
              {chatLocked && (
                <div className="shrink-0 border-t border-border p-3">
                  <p className="flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground">
                    <Lock className="size-3.5" />
                    {ticketChatLockedNotice(status)}
                  </p>
                </div>
              )}
              {canComment && (chatTab === "internal" || canPostPublic) && (
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
                // Several compact cards per row instead of one full-width band each —
                // a ticket can carry many logs, and one column made the tab a long scroll.
                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {logs.map((log) => (
                    <MaintenanceLogCard
                      key={log.id}
                      log={log}
                      onEdit={canEditLog ? () => setEditingLog(log) : undefined}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Sub Issue — staff break the ticket down into smaller tasks themselves.
                Its TabsTrigger is deliberately absent, so this panel is unreachable for now;
                the content stays so re-enabling it is one line back in the TabsList. */}
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
                basePath="/staff"
                searchArticles={searchKbArticles}
                getArticleDetail={getKbArticleDetail}
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
                <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                  (ticket.suspectedDuplicateOfTicketId && !chatLocked)) && (
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                    {/* Dropped once the ticket is finished — the duplicate question is settled
                        by then, and a ticket closed BY a merge would still flag itself. */}
                    {ticket.suspectedDuplicateOfTicketId && !chatLocked && (
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
                <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  SLA
                </p>
                {ticket.slaTimer ? (
                  <div className="space-y-2.5">
                    {/* Single-line chip clock — MATCHES Manager. A multi-line version with its
                        own progress bar would give the SLA block 2 bars drawing the same
                        ratio (the small one here + the "remaining" bar below). */}
                    <div className="flex items-center justify-between">
                      {/* "Duration", not "Status": the value beside it is a live countdown to
                          the deadline, not a state name. Admin's SLA panel does show
                          slaTimer.status, so it keeps the Status label. */}
                      <span className="text-xs text-muted-foreground">
                        Duration
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
                        {format(new Date(ticket.slaTimer.dueAt), "dd/MM HH:mm")}
                      </span>
                    </div>
                    {/* Live-clock only — see the Manager panel. A Stopped/Met/Breached timer
                        has remainingPercent = 0 from the BE, so the bar would either read as
                        an empty red near-breach or, on stale data, a full green clock on a
                        ticket nobody is working any more. */}
                    {isSlaClockLive(ticket.slaTimer.status) && (
                      <>
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
                            className={`h-full rounded-full transition-[width,background-color] duration-(--motion-enter) ease-linear ${slaBarCls}`}
                            style={{
                              width: `${Math.max(0, ticket.slaTimer.remainingPercent)}%`,
                            }}
                          />
                        </div>
                      </>
                    )}
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
                <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
                  <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Description
                  </p>
                  <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>
              )}

              {/* Attachments (photos the customer attached when creating the ticket) */}
              {ticket.attachmentFileIds &&
                ticket.attachmentFileIds.length > 0 && (
                  <div className="p-4">
                    <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Attached photos
                    </p>
                    <TicketAttachments
                      fileIds={ticket.attachmentFileIds}
                      label={null}
                      compact
                    />
                  </div>
                )}

              {/* GH-1176: BE reuses ticket.Reason for Hold/Reject/Escalate notes — label kept generic. */}
              {ticket.rejectionReason && (
                <div className="p-4">
                  <p className="text-3xs font-semibold text-destructive uppercase tracking-wider mb-2">
                    Reason
                  </p>
                  <p className="text-xs leading-relaxed">
                    {ticket.rejectionReason}
                  </p>
                </div>
              )}

              {/* Resolution */}
              {ticket.resolutionSummary && (
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10">
                  <p className="text-3xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
                    Resolution
                  </p>
                  <p className="text-base leading-relaxed whitespace-pre-wrap mb-2">
                    {ticket.resolutionSummary}
                  </p>
                  {ticket.resolvedAt && (
                    <p className="text-3xs text-emerald-700/70 dark:text-emerald-400/70">
                      Resolved at{" "}
                      {format(new Date(ticket.resolvedAt), "dd/MM/yyyy HH:mm", {
                        locale: enUS,
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Escalation */}
              {ticket.escalatedAt && (
                <div className="p-4 bg-orange-50/50 dark:bg-orange-950/10">
                  <p className="text-3xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-2">
                    Escalation
                  </p>
                  {ticket.escalationReason && (
                    <p className="text-xs leading-relaxed">
                      {ESCALATION_REASON_LABEL[ticket.escalationReason] ??
                        ticket.escalationReason}
                    </p>
                  )}
                  <p className="text-3xs text-orange-700/70 dark:text-orange-400/70 mt-1">
                    {format(new Date(ticket.escalatedAt), "dd/MM/yyyy HH:mm", {
                      locale: enUS,
                    })}
                  </p>
                </div>
              )}

              {/* Customer rating */}
              {ticket.rating != null && (
                <div className="p-4">
                  <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
                {ticket.isPeriodicMaintenance && (
                  <>
                    <SideInfoRow
                      label="Maintenance due"
                      value={
                        ticket.periodicMaintenanceDueAtUtc ? (
                          <span className="inline-flex items-center gap-1.5">
                            {format(
                              new Date(ticket.periodicMaintenanceDueAtUtc),
                              "dd/MM/yyyy HH:mm",
                              { locale: enUS },
                            )}
                            {/* Quá hạn là tin cần biết ngay, nhưng nó nói về CÁI HẠN NÀY — nên đứng
                                cạnh ngày, không tách thành một hàng "Periodic · overdue" riêng. */}
                            {ticket.isPeriodicMaintenanceOverdue && (
                              <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-3xs font-semibold uppercase tracking-wide text-destructive">
                                Overdue
                              </span>
                            )}
                          </span>
                        ) : null
                      }
                    />
                    <SideInfoRow
                      label="Visit schedule"
                      value={
                        ticket.scheduledStartAtUtc
                          ? format(
                              new Date(ticket.scheduledStartAtUtc),
                              "dd/MM/yyyy HH:mm",
                              { locale: enUS },
                            )
                          : null
                      }
                    />
                  </>
                )}
                {/* Who's handling it — the BE returns staffName, so every role can read it
                    without calling /api/staff (that endpoint is only open to Admin/Manager). */}
                <SideInfoRow
                  label="Primary handler"
                  value={primaryHandlerName}
                />
                {supporterNames.length > 0 && (
                  <SideInfoRow
                    label="Supporters"
                    value={supporterNames.join(", ")}
                  />
                )}
                {previousPrimaryHandlerNames.length > 0 && (
                  <SideInfoRow
                    label="Previous handler"
                    value={previousPrimaryHandlerNames.join(", ")}
                  />
                )}
                {/* GH-866 — 1 detection timestamp (replaces the old from/to pair). */}
                {ticket.detectedAt && (
                  <SideInfoRow
                    label="Detected at"
                    value={format(
                      new Date(ticket.detectedAt),
                      "dd/MM/yyyy HH:mm",
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
                    "dd/MM/yyyy HH:mm",
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
      <ResumeDialog
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        onSubmit={handleResumeSubmit}
        isPending={resumeMutationForHeld.isPending}
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
      {/* Complete requires a maintenance log first — this dialog's summary becomes the ticket's resolutionSummary. */}
      <MaintenanceLogDialog
        open={completeLogOpen}
        onClose={() => setCompleteLogOpen(false)}
        onSubmit={handleCompleteLogSubmit}
        isPending={logMutation.isPending || completeMutation.isPending}
        title="Complete ticket"
        submitLabel="Save log & complete"
        fixedLogType={MaintenanceLogTypeEnum.Completion}
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
