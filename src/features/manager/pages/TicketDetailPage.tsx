import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  ArrowLeft,
  Copy,
  Lock,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import ChatUnreadBadge from "@/shared/components/ticket/ChatUnreadBadge";
import TicketVerifyBadge from "@/shared/components/ticket/TicketVerifyBadge";
import TypingIndicator from "@/shared/components/chat/TypingIndicator";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";

import TicketSlaSection from "@/shared/components/ticket/TicketSlaSection";
// GH-1176: TriageDialog (approval) removed.
import AssignDialog from "@/features/manager/components/ticket/AssignDialog";
import ReassignDialog from "@/features/manager/components/ticket/ReassignDialog";
import RejectDialog from "@/features/manager/components/ticket/RejectDialog";
import TriageRejectDialog from "@/features/manager/components/ticket/TriageRejectDialog";
import EscalateDialog from "@/features/manager/components/ticket/EscalateDialog";
import EscalateRejectDialog from "@/features/manager/components/ticket/EscalateRejectDialog";
import ReprioritizeDialog from "@/features/manager/components/ticket/ReprioritizeDialog";
import DeclareIncidentDialog from "@/features/manager/components/ticket/DeclareIncidentDialog";
import TicketActivityTimeline from "@/shared/components/ticket/TicketActivityTimeline";
import AddCommentForm from "@/features/manager/components/ticket/AddCommentForm";
import TicketAttachments from "@/shared/components/ticket/TicketAttachments";
import {
  TicketCommentThread,
  type ChatTab,
} from "@/shared/components/ticket/TicketCommentThread";
import { ProcessingDurationTimer } from "@/shared/components/ticket/ProcessingDurationTimer";
import BatteryAssetInfoPanel from "@/features/manager/components/battery/BatteryAssetInfoPanel";
import EnvironmentalIncidentInfoPanel from "@/shared/components/ticket/EnvironmentalIncidentInfoPanel";
import MaintenanceLogCard from "@/shared/components/ticket/MaintenanceLogCard";
import { getTicketSubject, ticketBatteryIds } from "@/shared/lib/ticketSubject";
import RelatedTicketsPanel from "@/shared/components/ticket/RelatedTicketsPanel";
import TicketBmsAction from "@/shared/components/ticket/TicketBmsAction";
import {
  useManagerTicketDetail,
  useTicketActivities,
  useApproveTicket,
  useTicketComments,
  useReVerifyTicket,
  useAdminTicketList,
  useTicketRelated,
  useLinkParentTicket,
} from "@/features/manager/hooks/ticket/useManagerTickets";
import { useMergeCandidates } from "@/shared/hooks/ticket/useMergeCandidates";
import {
  isTicketChatLocked,
  ticketChatLockedNotice,
} from "@/shared/utils/ticket.utils";
import { useTicketCommentsRealtime } from "@/shared/hooks/ticket/useTicketCommentsRealtime";
import { useMentionCandidates } from "@/shared/hooks/ticket/useTicketParticipants";
import {
  useUpdateTicketChat,
  useDeleteTicketChat,
  useMarkTicketChatsRead,
  useTranslateTicketChat,
} from "@/shared/hooks/ticket/useTicketChatActions";
import { useChatSender } from "@/shared/hooks/ticket/useChatSender";
import { managerTicketService } from "@/features/manager/services/ticket/ticket.service";
import {
  TicketStatusEnum,
  ImpactScopeEnum,
  UrgencyLevelEnum,
  TicketCategoryEnum,
} from "@/shared/types/ticket/ticket.types";
import {
  getPrimaryHandlerName,
  getSupporterNames,
  getPreviousPrimaryHandlerNames,
} from "@/shared/utils/ticket/assignments";
import TicketKbReferencesPanel from "@/shared/components/ticket/TicketKbReferencesPanel";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { ESCALATION_REASON_LABEL } from "@/shared/constants/ticketLabels";
import { KEY } from "@/shared/utils/queryKeys";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { managerKbService } from "@/features/manager/services/kb/kb.service";
import type { KbArticleSearchParams } from "@/shared/components/kb/KbArticleSelector";

// Article lookups stay with the role's own KB service: Manager's carries the
// approve/publish workflow that Staff's does not, and shared must not import from a
// feature. The panel only needs these two reads.
const searchKbArticles = ({ q, category }: KbArticleSearchParams) =>
  managerKbService
    .getList({
      q,
      category: category ? KbCategoryCode[category] : undefined,
      status: KbArticleStatusEnum.Published,
      pageSize: 20,
    })
    .then((r) => r.data.data?.items ?? []);

const getKbArticleDetail = (id: string) =>
  managerKbService.getDetail(id).then((r) => r.data.data!);

import { KbArticleStatusEnum, KbCategoryCode } from "@/shared/enums/kb/kb.enum";

// GH-1176: "triage" (approval) removed; "escalate" (force) removed;
// "escalate-approve" and "escalate-reject" added for Request-status handling.
type DialogType =
  | "triage-reject"
  | "assign"
  | "reassign"
  | "reject"
  | "escalate-approve"
  | "escalate-reject"
  | "reprioritize"
  | "incident"
  | null;

const CATEGORY_LABEL: Partial<Record<TicketCategoryEnum, string>> = {
  Charging: "Charging",
  Overheat: "Overheat",
  NoPower: "No power",
  Performance: "Performance",
  Repair: "Repair",
  Other: "Other",
};

// Statuses where the ticket is finished for good — no further Manager action is meaningful.
const TERMINAL_STATUSES: TicketStatusEnum[] = [
  TicketStatusEnum.Completed,
  TicketStatusEnum.Closed,
  TicketStatusEnum.ClosedRejected,
];

const IMPACT_LABEL: Record<ImpactScopeEnum, string> = {
  SingleAsset: "Single Asset",
  Site: "Site",
  MultiSite: "Multi Site",
};

const URGENCY_LABEL: Record<UrgencyLevelEnum, string> = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
};

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
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // Reached from either /manager/tickets/:id (list) or /manager/tickets/queue/:id (queue) —
  // same detail page, but Back must return to whichever list the user came from.
  const isFromQueue = location.pathname.startsWith("/manager/tickets/queue/");
  const backToListPath = isFromQueue
    ? "/manager/tickets/queue"
    : "/manager/tickets";
  const [dialog, setDialog] = useState<DialogType>(null);
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

  const { data: ticket, isLoading, isError } = useManagerTicketDetail(id);
  const { data: activities = [], isLoading: activitiesLoading } =
    useTicketActivities(id);
  const { data: relatedTickets, isLoading: relatedLoading } =
    useTicketRelated(id);
  const linkParent = useLinkParentTicket();
  const { data: comments = [] } = useTicketComments(id, mainTab === "comments");

  // The BE already returns `staffName` in assignments (synced from StaffAccount), so there's
  // no need to look it up via staffList — the helper falls back to staffId when the name is missing.
  const primaryHandlerName = getPrimaryHandlerName(ticket?.assignments);
  const supporterNames = getSupporterNames(ticket?.assignments);
  const previousPrimaryHandlerNames = getPreviousPrimaryHandlerNames(
    ticket?.assignments,
  );

  // Read-only for these roles — the Logs tab and its count both read from here.
  const maintenanceLogs = ticket?.maintenanceLogs ?? [];

  const existingFileIds = useMemo(() => {
    const ids = new Set<string>();
    if (ticket?.attachmentFileIds) {
      ticket.attachmentFileIds.forEach((fileId) => ids.add(fileId));
    }
    if (ticket?.maintenanceLogs) {
      ticket.maintenanceLogs.forEach((log) => {
        log.attachmentFileIds?.forEach((fileId) => ids.add(fileId));
        log.beforePhotosFileIds?.forEach((fileId) => ids.add(fileId));
        log.afterPhotosFileIds?.forEach((fileId) => ids.add(fileId));
      });
    }
    comments.forEach((c) => {
      c.attachmentFileIds?.forEach((fileId) => ids.add(fileId));
    });
    return Array.from(ids);
  }, [ticket, comments]);
  const { typingNames, sendTyping, pinNotices } = useTicketCommentsRealtime(id);
  const { mutate: approve, isPending: approving } = useApproveTicket(id);
  const reVerify = useReVerifyTicket(id);
  const user = useSessionStore((s) => s.user);
  const currentUserId = user?.accountId;
  // People who can be @-tagged: active participants of the ticket (GET .../participants).
  // Does NOT use chat authors — someone newly added to the ticket who hasn't sent a message yet must still be taggable.
  const mentionCandidates = useMentionCandidates(id);
  const { mutate: updateChat, isPending: editChatPending } =
    useUpdateTicketChat();
  const { mutate: deleteChat, isPending: deleteChatPending } =
    useDeleteTicketChat();
  const { mutate: markChatsRead } = useMarkTicketChatsRead();
  const handleMarkRead = (chatIds: string[], onFailed: () => void) =>
    markChatsRead({ ticketId: id, payload: { chatIds }, onFailed });
  const { mutateAsync: translateChat } = useTranslateTicketChat();
  const handleTranslate = (chat: { id: string }, targetLanguage: string) =>
    translateChat({ ticketId: id, chatId: chat.id, targetLanguage });

  // Chat outbox: worker sends sequentially with retry; composer enqueues; thread renders pending.
  const {
    pending: pendingChats,
    retry: retryChat,
    discard: discardChat,
  } = useChatSender(id, managerTicketService.addComment);

  // Same pair MergeComparePage uses, so the merge button only appears when that page would
  // actually have something to offer — otherwise clicking it lands on an empty target picker.
  // useAdminTicketList shares its query key (and 30s staleTime) with the ticket list page, so
  // this usually resolves from cache; useMergeCandidates is a plain useMemo, no extra request.
  // TicketGetListQueryHandler hides Open tickets by default (that's the Queue's job), so a
  // second call with status=Open is required — otherwise an Open source ticket (the only case
  // canMerge even applies) can never find its Open auto-origin target (e.g. the AI-suggested one).
  const { data: mergeSourceList } = useAdminTicketList({ pageSize: 100 });
  const { data: mergeSourceOpenList } = useAdminTicketList({
    pageSize: 100,
    status: TicketStatusEnum.Open,
  });
  const mergeSourceItems = useMemo(
    () => [
      ...(mergeSourceList?.items ?? []),
      ...(mergeSourceOpenList?.items ?? []),
    ],
    [mergeSourceList?.items, mergeSourceOpenList?.items],
  );
  // useMemo keeps the array identity stable — useMergeCandidates depends on it.
  const sourceBatteryIds = useMemo(
    () => (ticket ? ticketBatteryIds(ticket) : []),
    [ticket],
  );
  const mergeCandidates = useMergeCandidates(
    mergeSourceItems,
    id,
    ticket?.suspectedDuplicateOfTicketId,
    sourceBatteryIds,
  );

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive mb-4">
          Ticket not found or you don't have access.
        </p>
        <Button variant="outline" onClick={() => navigate(backToListPath)}>
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

  const status = ticket.status;
  // GH-1176: triage approval removed; only triage-reject (Open→ClosedRejected) remains.
  // Ticket finished → chat is archived: composer hidden, edit/delete locked in the thread.
  const chatLocked = isTicketChatLocked(status);
  const canTriageReject = status === TicketStatusEnum.Open;
  // GH-1176: assign Open→InProgress (current schedule) or Open→Pending (future schedule).
  const canAssign = status === TicketStatusEnum.Open;
  // GH-1176: reassign only from ReAssign status.
  const canReassign = status === TicketStatusEnum.ReAssign;
  // GH-1176: approve/reject completion (Completed → Closed / Completed → InProgress).
  const canApprove = status === TicketStatusEnum.Completed;
  const canReject = status === TicketStatusEnum.Completed;
  // GH-1176: Manager approves/rejects Staff escalation request (Request status).
  const canEscalateApprove = status === TicketStatusEnum.Request;
  const canEscalateReject = status === TicketStatusEnum.Request;
  // GH-1176: force escalation endpoint removed; only Staff-requested escalation remains.
  // canReprioritize: Open only — priority fixed once assigned per User Guide §3.8.
  // An incident is pinned at Urgent: declaring one stops the SLA timer and isolates the
  // battery, so letting it drop back to P1/P2/P3 would strand those side effects.
  const canReprioritize =
    status === TicketStatusEnum.Open && !ticket.isIncident;
  // A closed-out ticket can no longer be turned into an incident — the work is already
  // finished or rejected, so declaring one would create an incident nobody will act on.
  const canDeclareIncident =
    !ticket.isIncident && !TERMINAL_STATUSES.includes(status);
  // GH-1176: merge source must be Open (previously New, which no longer exists).
  // Also require at least one valid target, otherwise the merge page opens with nothing to pick.
  const canMerge =
    !ticket.mergedIntoTicketId &&
    status === TicketStatusEnum.Open &&
    mergeCandidates.length > 0;

  // comments come from a separate query (useTicketComments) + realtime push (SignalR).

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-3 shrink-0 border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="-ml-1 shrink-0"
            onClick={() => navigate(backToListPath)}
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground">
                {ticket.code}
              </span>
              <TicketStatusBadge status={ticket.status} />
              {ticket.priority && (
                <TicketPriorityBadge priority={ticket.priority} />
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
          {/* Cutting charge/discharge is the first move on a thermal or overcharge ticket, so it
              sits with the other header actions rather than a screen away. Picks battery vs
              whole-site itself, and hides once the ticket is finished. */}
          <TicketBmsAction ticket={ticket} />
          {canAssign && (
            <Button size="sm" onClick={() => setDialog("assign")}>
              Assign Staff
            </Button>
          )}
          {canReassign && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialog("reassign")}
            >
              Reassign
            </Button>
          )}
          {canApprove && (
            <Button
              size="sm"
              onClick={() => approve(undefined)}
              disabled={approving}
            >
              {approving ? "Processing..." : "Approve"}
            </Button>
          )}
          {canReject && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDialog("reject")}
            >
              Reject
            </Button>
          )}
          {/* GH-1176: Manager approves/rejects Staff escalation request */}
          {canEscalateApprove && (
            <Button size="sm" onClick={() => setDialog("escalate-approve")}>
              Approve escalation
            </Button>
          )}
          {canEscalateReject && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialog("escalate-reject")}
            >
              Reject escalation
            </Button>
          )}
          {canReprioritize && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialog("reprioritize")}
            >
              Change priority
            </Button>
          )}
          {canDeclareIncident && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDialog("incident")}
            >
              Declare Incident
            </Button>
          )}
          {canTriageReject && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDialog("triage-reject")}
            >
              Reject ticket
            </Button>
          )}
          {canMerge && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/manager/tickets/${id}/merge`)}
            >
              Merge ticket
            </Button>
          )}
          <RefreshButton queryKeys={[KEY.manager.tickets, KEY.tickets]} />
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
                <TabsTrigger value="comments" className="group">
                  Chat
                  <ChatUnreadBadge ticketId={id} />
                </TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="logs">
                  Logs
                  {maintenanceLogs.length > 0 && ` (${maintenanceLogs.length})`}
                </TabsTrigger>
                <TabsTrigger value="kb">Guide</TabsTrigger>
              </TabsList>
            </div>

            {/* Info — battery asset info + attachments */}
            <TabsContent
              value="info"
              className="min-h-0 overflow-y-auto m-0 p-6 space-y-6"
            >
              {/* A ticket can have multiple batteries attached — loop over each. Fallback to single battery (legacy). */}
              {(() => {
                // Which subject this ticket is about — battery vs site — decided in one
                // place (getTicketSubject) so both detail pages classify identically.
                const subject = getTicketSubject(ticket);
                if (subject.kind === "site")
                  return (
                    <EnvironmentalIncidentInfoPanel
                      incidentId={subject.incidentId}
                      siteId={subject.siteId}
                      detectedAt={ticket.detectedAt}
                      description={ticket.description}
                      siteBasePath="/manager"
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
                        {ids.length} related battery devices
                      </p>
                    )}
                    {ids.map((bid) => (
                      <BatteryAssetInfoPanel
                        key={bid}
                        batteryAssetId={bid}
                        detectedAt={ticket.detectedAt}
                        originAlertId={ticket.originAlertId}
                      />
                    ))}
                  </div>
                );
              })()}

              {/* One cabinet fault raises several tickets at once — the system's environmental
                  ticket plus the customer's per-battery ones. Same cause, separate work, so they
                  are listed side by side and can be linked without closing any of them. */}
              <RelatedTicketsPanel
                ticket={ticket}
                related={relatedTickets}
                isLoading={relatedLoading}
                // Same detail page lives under two routes (/tickets/:id and /tickets/queue/:id).
                // Reuse whichever the user is on, so following a related ticket keeps them in
                // the Queue if that is where they came from — and Back keeps working, since the
                // queue route is what restores the Queue list.
                basePath={backToListPath}
                onLinkParent={(ticketId, parentTicketId) =>
                  linkParent.mutate({ ticketId, payload: { parentTicketId } })
                }
                isLinking={linkParent.isPending}
              />
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
                  ticketId={id}
                  aiEnabled
                  onSelectSuggestion={(text) =>
                    setComposerPrefill((prev) => ({
                      text,
                      version: prev.version + 1,
                    }))
                  }
                  onEdit={(chat, body) =>
                    updateChat({
                      ticketId: id,
                      chatId: chat.id,
                      payload: { body },
                    })
                  }
                  onDelete={(chat) =>
                    deleteChat({ ticketId: id, chatId: chat.id })
                  }
                  editPending={editChatPending}
                  deletePending={deleteChatPending}
                  onMarkRead={handleMarkRead}
                  onTranslate={handleTranslate}
                  pendingMessages={pendingChats}
                  onRetryPending={retryChat}
                  onDiscardPending={discardChat}
                />
              </div>
              <div className="shrink-0 border-t border-border p-3">
                {chatLocked ? (
                  <p className="flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground">
                    <Lock className="size-3.5" />
                    {ticketChatLockedNotice(status)}
                  </p>
                ) : (
                  <>
                    <TypingIndicator names={typingNames} />
                    <AddCommentForm
                      ticketId={id}
                      onTyping={sendTyping}
                      isInternal={chatTab === "internal"}
                      existingFileIds={existingFileIds}
                      prefillText={composerPrefill.text}
                      prefillVersion={composerPrefill.version}
                      mentionCandidates={mentionCandidates}
                    />
                  </>
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

            {/* KB */}

            {/* Maintenance logs — read-only here: the BE only lets a log's own author edit it. */}
            <TabsContent
              value="logs"
              className="min-h-0 overflow-y-auto m-0 p-6"
            >
              {maintenanceLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No maintenance logs yet.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {maintenanceLogs.map((log) => (
                    <MaintenanceLogCard key={log.id} log={log} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="kb" className="min-h-0 overflow-y-auto m-0 p-6">
              <TicketKbReferencesPanel
                ticketId={id}
                // GH: the BE rejects attaching once a ticket is terminal
                // (AddTicketKbReferenceCommandHandler returns 409). This page used to leave
                // the button enabled and let the request fail.
                canAdd={!isTicketChatLocked(status)}
                afterResolveOnly={status === TicketStatusEnum.Completed}
                defaultCategory={ticket.category}
                basePath="/manager"
                searchArticles={searchKbArticles}
                getArticleDetail={getKbArticleDetail}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Sidebar — always mounted, animates width (synced with left sidebar) */}
        <aside
          className={cn(
            "shrink-0 border-l border-border overflow-hidden transition-[width] duration-300 ease-in-out",
            sidebarOpen ? "w-75" : "w-8",
          )}
        >
          {/* Collapsed rail — button to reopen the info panel */}
          {!sidebarOpen && (
            <div className="w-8 h-full flex items-start justify-center pt-4 animate-in fade-in duration-200">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(true)}
                      aria-label="Open info panel"
                      className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                    />
                  }
                >
                  <PanelRightOpen size={15} />
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={8}>
                  Open info panel
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Panel content — only shown when open, fixed width w-75 to avoid reflow while sliding */}
          {sidebarOpen && (
            <div className="w-75 h-full overflow-y-auto flex flex-col divide-y divide-border animate-in fade-in slide-in-from-right-4 duration-300 ease-out">
              {/* Header — collapse button */}
              <div className="flex items-center justify-between px-4 py-2 shrink-0">
                <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Info
                </p>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Collapse info panel"
                        className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                      />
                    }
                  >
                    <PanelRightClose size={15} />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8}>
                    Collapse info panel
                  </TooltipContent>
                </Tooltip>
              </div>
              {/* ── AI verify + suspected duplicate (Customer-created manual tickets only) ──
                  Placed AT THE TOP: Manager needs to read the AI assessment + duplicate warning
                  before triaging, not scroll to the bottom to find it. */}
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
                    {/* Button to trigger AI re-check — only when Skipped/Pending. */}
                    {(ticket.aiVerifyStatus === "Skipped" ||
                      ticket.aiVerifyStatus === "Pending") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        disabled={reVerify.isPending}
                        onClick={() => reVerify.mutate()}
                      >
                        {reVerify.isPending ? "Sending…" : "Re-check with AI"}
                      </Button>
                    )}
                    {/* Dropped once the ticket is finished: it can no longer be merged, and a
                        ticket that reached Closed BY being merged would otherwise keep
                        advertising the duplicate it has already been folded into. */}
                    {ticket.suspectedDuplicateOfTicketId && !chatLocked && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                        {/* Copy icon, not a warning triangle: this panel says "these two look
                            like the same thing", which is a different message from the merge
                            page's triangle warning "these two are probably NOT the same". */}
                        <p className="font-medium flex items-center gap-1.5">
                          <Copy size={13} className="shrink-0" />
                          Suspected duplicate of another ticket
                        </p>
                        {ticket.duplicateReason && (
                          <p className="mt-0.5">{ticket.duplicateReason}</p>
                        )}
                        {canMerge && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7"
                            onClick={() =>
                              navigate(`/manager/tickets/${id}/merge`, {
                                state: {
                                  suggestedTargetId:
                                    ticket.suspectedDuplicateOfTicketId,
                                },
                              })
                            }
                          >
                            Merge ticket
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

              {/* SLA */}
              <TicketSlaSection ticket={ticket} />

              {/* Status + processing time */}
              <div className="p-4">
                <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Status
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Current
                    </span>
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Processing time
                    </span>
                    <ProcessingDurationTimer
                      activities={activities}
                      status={ticket.status}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              {ticket.description && (
                <div className="p-4">
                  <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Description
                  </p>
                  <p className="text-sm font-medium leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {ticket.description}
                  </p>
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
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap mb-2">
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
                    <p className="text-sm font-medium leading-relaxed text-foreground/90 mt-1.5 whitespace-pre-wrap">
                      {ticket.ratingComment}
                    </p>
                  )}
                </div>
              )}

              {/* Meta */}
              <div className="px-4 py-1 divide-y divide-border/50">
                <SideInfoRow
                  label="Category"
                  value={CATEGORY_LABEL[ticket.category] ?? ticket.category}
                />
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
                    <SideInfoRow
                      label="Selection deadline"
                      value={
                        ticket.periodicMaintenanceScheduleDeadlineAtUtc
                          ? format(
                              new Date(
                                ticket.periodicMaintenanceScheduleDeadlineAtUtc,
                              ),
                              "dd/MM/yyyy HH:mm",
                              { locale: enUS },
                            )
                          : null
                      }
                    />
                  </>
                )}
                <SideInfoRow
                  label="Primary Handler"
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
                {/* Hidden on site-level tickets: the row can never hold a value there, and an
                    empty "—" reads as data that failed to load rather than a field that does
                    not apply. */}
                {!ticket.environmentalIncidentId && (
                  <SideInfoRow
                    label="Battery serial"
                    value={ticket.batterySerialNumber ?? null}
                  />
                )}
                {/* GH-866 — single incident detection timestamp (replaces the old from/to pair). */}
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
                <SideInfoRow
                  label="Scope"
                  value={
                    ticket.impactScope
                      ? (IMPACT_LABEL[ticket.impactScope] ?? ticket.impactScope)
                      : null
                  }
                />
                <SideInfoRow
                  label="Urgency"
                  value={
                    ticket.urgencyLevel
                      ? (URGENCY_LABEL[ticket.urgencyLevel] ??
                        ticket.urgencyLevel)
                      : null
                  }
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
                {ticket.updatedAt && (
                  <SideInfoRow
                    label="Updated"
                    value={format(
                      new Date(ticket.updatedAt),
                      "dd/MM/yyyy HH:mm",
                      {
                        locale: enUS,
                      },
                    )}
                  />
                )}
                {ticket.approvedAt && (
                  <SideInfoRow
                    label="Approved at"
                    value={format(
                      new Date(ticket.approvedAt),
                      "dd/MM/yyyy HH:mm",
                      {
                        locale: enUS,
                      },
                    )}
                  />
                )}
                {ticket.closedAt && (
                  <SideInfoRow
                    label="Closed at"
                    value={format(
                      new Date(ticket.closedAt),
                      "dd/MM/yyyy HH:mm",
                      {
                        locale: enUS,
                      },
                    )}
                  />
                )}
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
      {/* GH-1176: "triage" (approval) dialog removed. */}
      {dialog === "triage-reject" && (
        <TriageRejectDialog
          ticketId={id}
          open
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "assign" && (
        <AssignDialog
          ticketId={id}
          priority={ticket.priority}
          scheduledStartAtUtc={ticket.scheduledStartAtUtc}
          isPeriodicMaintenance={ticket.isPeriodicMaintenance}
          open
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "reassign" && (
        <ReassignDialog
          ticketId={id}
          priority={ticket.priority}
          open
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "reject" && (
        <RejectDialog ticketId={id} open onClose={() => setDialog(null)} />
      )}
      {dialog === "escalate-approve" && (
        <EscalateDialog ticketId={id} open onClose={() => setDialog(null)} />
      )}
      {dialog === "escalate-reject" && (
        <EscalateRejectDialog
          ticketId={id}
          open
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "reprioritize" && (
        <ReprioritizeDialog
          ticketId={id}
          currentImpact={ticket.impactScope}
          currentUrgency={ticket.urgencyLevel}
          open
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "incident" && (
        <DeclareIncidentDialog
          ticketId={id}
          open
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
