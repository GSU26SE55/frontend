import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { ArrowLeft, AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPrimaryHandlerName,
  getSupporterNames,
  getPreviousPrimaryHandlerNames,
} from "@/shared/utils/ticket/assignments";
import {
  isTicketChatLocked,
  ticketChatLockedNotice,
} from "@/shared/utils/ticket.utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BatteryAssetInfoPanel from "@/features/admin/components/battery/BatteryAssetInfoPanel";
import EnvironmentalIncidentInfoPanel from "@/shared/components/ticket/EnvironmentalIncidentInfoPanel";
import MaintenanceScheduleCountdown from "@/shared/components/ticket/MaintenanceScheduleCountdown";
import { getTicketSubject } from "@/shared/lib/ticketSubject";
import RelatedTicketsPanel from "@/shared/components/ticket/RelatedTicketsPanel";
import TicketBmsAction from "@/shared/components/ticket/TicketBmsAction";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  useAdminTicketDetail,
  useAdminTicketActivities,
  useAdminTicketComments,
  useDeclareIncident,
  useAdminTicketRelated,
} from "@/features/admin/hooks/ticket/useAdminTickets";
import AddCommentForm from "@/features/admin/components/ticket/AddCommentForm";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import ChatUnreadBadge from "@/shared/components/ticket/ChatUnreadBadge";
import MaintenanceLogCard from "@/shared/components/ticket/MaintenanceLogCard";
import TicketVerifyBadge from "@/shared/components/ticket/TicketVerifyBadge";
import MergeTicketDialog from "@/features/admin/components/ticket/MergeTicketDialog";
import TypingIndicator from "@/shared/components/chat/TypingIndicator";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import TicketActivityTimeline from "@/features/admin/components/ticket/TicketActivityTimeline";
import AdminClosedOverrideDialog from "@/features/admin/components/ticket/AdminClosedOverrideDialog";
import TicketAttachments from "@/shared/components/ticket/TicketAttachments";
import type { TicketCommentDTO } from "@/shared/types/ticket/ticket.types";
import {
  TicketCommentThread,
  type ChatTab,
} from "@/shared/components/ticket/TicketCommentThread";
import { ProcessingDurationTimer } from "@/shared/components/ticket/ProcessingDurationTimer";
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

import TicketSlaSection from "@/shared/components/ticket/TicketSlaSection";
import { TICKET_CATEGORY_LABEL } from "@/shared/constants/ticketLabels";
import TicketKbReferencesPanel from "@/shared/components/ticket/TicketKbReferencesPanel";
import { TicketStatusEnum } from "@/shared/enums/ticket/ticket.enum";
import { adminKbService } from "@/features/admin/services/kb/kb.service";
import type { KbArticleSearchParams } from "@/shared/components/kb/KbArticleSelector";
import { KbArticleStatusEnum, KbCategoryCode } from "@/shared/enums/kb/kb.enum";

// Article lookups stay with the role's own KB service — shared must not import from a
// feature. The panel only needs these two reads.
const searchKbArticles = ({ q, category }: KbArticleSearchParams) =>
  adminKbService
    .getList({
      q,
      category: category ? KbCategoryCode[category] : undefined,
      status: KbArticleStatusEnum.Published,
      pageSize: 20,
    })
    .then((r) => r.data.data?.items ?? []);

const getKbArticleDetail = (id: string) =>
  adminKbService.getDetail(id).then((r) => r.data.data!);

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

/**
 * The Admin page DELIBERATELY offers only: view, Declare Incident, Merge ticket, and chat override.
 *
 * The triage / assign Staff / approve buttons are not missing. User Guide §3.9–3.13 assigns
 * those to the Manager role; Admin in §3.3 only handles site, battery and alert threshold setup.
 *
 * The BE does still let Admin take every transition (TransitionRuleProvider has an
 * ActorRoleEnum.Admin branch in most rules, see the "Admin Override Transitions" region in
 * TicketStateMachineTests). That is a technical escape hatch — unsticking a ticket when Staff
 * leave mid-way or a Manager is unavailable, done through the API directly — not an everyday
 * permission. Don't "fill in the gaps" by adding those buttons here: it would turn this into a
 * copy of the Manager page and diverge from the documentation.
 */
export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketId = id ?? "";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [incidentDescription, setIncidentDescription] = useState("");
  const [chatTab, setChatTab] = useState<ChatTab>("public");
  // Which outer tab is open. The chat query must NOT run until the user actually opens
  // the Chat tab: GET /chats auto-marks every message it returns as read on the BE, so
  // fetching it eagerly told the sender "seen" for a thread nobody had looked at.
  const [mainTab, setMainTab] = useState("info");
  const [composerPrefill, setComposerPrefill] = useState({
    text: "",
    version: 0,
  });
  // GH-133 C4 — Admin override to edit/delete chat on a Closed ticket.
  const [overrideTarget, setOverrideTarget] = useState<{
    chat: TicketCommentDTO;
    mode: "edit" | "delete";
  } | null>(null);

  const { data: ticket, isLoading: loadingDetail } = useAdminTicketDetail(id!);
  // Handler names — taken straight from assignments (BE already includes staffName).
  const primaryHandlerName = getPrimaryHandlerName(ticket?.assignments);
  const supporterNames = getSupporterNames(ticket?.assignments);
  const previousPrimaryHandlerNames = getPreviousPrimaryHandlerNames(
    ticket?.assignments,
  );
  const { data: activities = [], isLoading: loadingActivities } =
    useAdminTicketActivities(id!);
  const { data: relatedTickets, isLoading: relatedLoading } =
    useAdminTicketRelated(id!);
  const { data: comments = [] } = useAdminTicketComments(
    ticketId,
    mainTab === "comments",
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
  const { mutate: declareIncident, isPending } = useDeclareIncident();
  const user = useSessionStore((s) => s.user);
  const currentUserId = user?.accountId;
  // Who can be @-tagged: the ticket's active participants (GET .../participants).
  // Do NOT use chat authors — someone newly added to the ticket who hasn't posted yet must still be taggable.
  const mentionCandidates = useMentionCandidates(ticketId);
  const { typingNames, sendTyping, pinNotices } =
    useTicketCommentsRealtime(ticketId);
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

  function handleConfirm() {
    declareIncident(
      { id: id!, incidentDescription: incidentDescription.trim() },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setIncidentDescription("");
        },
      },
    );
  }

  if (loadingDetail) {
    return (
      <PageContainer className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-[calc(100vh-150px)] w-full rounded-xl" />
      </PageContainer>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Ticket not found.</p>
        <Button variant="outline" onClick={() => navigate("/admin/tickets")}>
          Back
        </Button>
      </div>
    );
  }


  // Ticket finished (Completed/Closed/ClosedRejected). Two consequences:
  //  - chat is archived: composer hidden, edit/delete locked in the thread (Admin's override
  //    edit/delete still applies — that path exists precisely for closed tickets);
  //  - the AI duplicate suggestion is dropped: a finished ticket can no longer be merged, and
  //    the ones that got here BY being merged would otherwise still advertise "merge me".
  const chatLocked = isTicketChatLocked(ticket.status);

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-3 shrink-0 border-b border-border flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="-ml-1 shrink-0"
            onClick={() => navigate("/admin/tickets")}
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

        <div className="flex items-center gap-2">
          {/* Cutting charge/discharge is the first move on a thermal or overcharge ticket, so it
              sits with the other header actions rather than a screen away. Picks battery vs
              whole-site itself, and hides once the ticket is finished. */}
          <TicketBmsAction ticket={ticket} />
          <Button
            variant="destructive"
            size="sm"
            disabled={ticket.isIncident || isPending}
            onClick={() => setConfirmOpen(true)}
          >
            <AlertTriangle size={13} />
            {ticket.isIncident ? "Already an Incident" : "Declare Incident"}
          </Button>
          <RefreshButton queryKeys={[KEY.admin.tickets, KEY.tickets]} />
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Timeline / Comments */}
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
                  Logs
                  {maintenanceLogs.length > 0 && ` (${maintenanceLogs.length})`}
                </TabsTrigger>
                <TabsTrigger value="kb">Guide</TabsTrigger>
              </TabsList>
            </div>

            {/* Read-only context: which battery (or site) this ticket is about, and the
                readings that triggered it. Carries no action buttons — triage and assignment
                remain the Manager's, per the note at the top of this file — but Admin still
                has to be able to SEE the evidence when investigating a ticket. */}
            <TabsContent
              value="info"
              className="min-h-0 overflow-y-auto m-0 p-6 space-y-6"
            >
              {ticket &&
                (() => {
                  // Same classifier as the Manager page, so both pages agree on whether a
                  // ticket is about a battery or a site.
                  const subject = getTicketSubject(ticket);
                  if (subject.kind === "site")
                    return (
                      <EnvironmentalIncidentInfoPanel
                        incidentId={subject.incidentId}
                        description={ticket.description}
                        siteBasePath="/admin"
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
                        />
                      ))}
                    </div>
                  );
                })()}

              {/* Read-only here: the BE authorises /link-parent for Manager only, so Admin sees
                  the relation without being offered a control that would 403. */}
              {ticket && (
                <RelatedTicketsPanel
                  ticket={ticket}
                  related={relatedTickets}
                  isLoading={relatedLoading}
                  basePath="/admin/tickets"
                />
              )}
            </TabsContent>

            <TabsContent
              value="timeline"
              className="min-h-0 overflow-y-auto m-0 p-6"
            >
              {loadingActivities ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <TicketActivityTimeline
                  activities={activities}
                  assignments={ticket?.assignments}
                />
              )}
            </TabsContent>

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
                  onSelectSuggestion={(text) =>
                    setComposerPrefill((prev) => ({
                      text,
                      version: prev.version + 1,
                    }))
                  }
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
                  onOverrideEdit={(chat) =>
                    setOverrideTarget({ chat, mode: "edit" })
                  }
                  onOverrideDelete={(chat) =>
                    setOverrideTarget({ chat, mode: "delete" })
                  }
                />
              </div>
              <div className="shrink-0 border-t border-border p-3">
                {chatLocked ? (
                  <p className="flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground">
                    <Lock className="size-3.5" />
                    {ticketChatLockedNotice(ticket.status)}
                  </p>
                ) : (
                  <>
                    <TypingIndicator names={typingNames} />
                    <AddCommentForm
                      ticketId={ticketId}
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
            <TabsContent value="kb" className="min-h-0 overflow-y-auto m-0 p-6">
              <TicketKbReferencesPanel
                ticketId={id ?? ""}
                // The BE rejects attaching once a ticket is terminal
                // (AddTicketKbReferenceCommandHandler returns 409).
                canAdd={!chatLocked}
                afterResolveOnly={ticket.status === TicketStatusEnum.Completed}
                defaultCategory={ticket.category}
                basePath="/admin"
                searchArticles={searchKbArticles}
                getArticleDetail={getKbArticleDetail}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Sidebar */}
        <div className="w-75 shrink-0 overflow-y-auto flex flex-col divide-y divide-border/60">
          {/* SLA */}
          <TicketSlaSection ticket={ticket} />
          {ticket.isPeriodicMaintenance && (
            <div className="p-4">
              <MaintenanceScheduleCountdown
                dueAtUtc={ticket.periodicMaintenanceDueAtUtc}
                scheduleDeadlineAtUtc={
                  ticket.periodicMaintenanceScheduleDeadlineAtUtc
                }
                isOverdue={ticket.isPeriodicMaintenanceOverdue}
              />
            </div>
          )}

          {/* Status + processing time */}
          <div className="p-4">
            <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Status
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Current</span>
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
              <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          )}

          {/* Attachments */}
          {ticket.attachmentFileIds && ticket.attachmentFileIds.length > 0 && (
            <div className="p-4">
              <p className="text-3xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Attachments
              </p>
              <TicketAttachments fileIds={ticket.attachmentFileIds} />
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
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {ticket.resolutionSummary}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="px-4 py-1">
            <SideInfoRow
              label="Category"
              value={TICKET_CATEGORY_LABEL[ticket.category] ?? ticket.category}
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
              </>
            )}
            {/* Who is handling it — BE returns staffName inline so every role can read it,
                no need to call /api/staff (that endpoint is Admin/Manager only). */}
            <SideInfoRow label="Primary handler" value={primaryHandlerName} />
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
            <SideInfoRow label="Scope" value={ticket.impactScope ?? null} />
            <SideInfoRow label="Urgency" value={ticket.urgencyLevel ?? null} />
            {/* Site-level ticket has no battery by design — see the Manager page for the full
                reasoning. An empty row here reads as a load failure. */}
            {!ticket.environmentalIncidentId && (
              <SideInfoRow
                label="Battery serial"
                value={ticket.batterySerialNumber ?? null}
              />
            )}
            <SideInfoRow
              label="Created"
              value={format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", {
                locale: enUS,
              })}
            />
            {/* GH-866 — a single incident detection timestamp (replaces the old from/to pair). */}
            {ticket.detectedAt && (
              <SideInfoRow
                label="Detected at"
                value={format(new Date(ticket.detectedAt), "dd/MM/yyyy HH:mm", {
                  locale: enUS,
                })}
              />
            )}
            {ticket.updatedAt && (
              <SideInfoRow
                label="Updated"
                value={format(new Date(ticket.updatedAt), "dd/MM/yyyy HH:mm", {
                  locale: enUS,
                })}
              />
            )}
          </div>

          {/* ── AI verify + suspected duplicate (only tickets created manually by a Customer) ── */}
          {ticket.origin === "ManualByCustomer" &&
            (ticket.aiVerifyStatus ||
              (ticket.suspectedDuplicateOfTicketId && !chatLocked)) && (
              <div className="px-4 py-3 space-y-2">
                <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                {ticket.suspectedDuplicateOfTicketId && !chatLocked && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                    <p className="font-medium">
                      ⚠ Suspected duplicate of another ticket
                    </p>
                    {ticket.duplicateReason && (
                      <p className="mt-0.5">{ticket.duplicateReason}</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7"
                      onClick={() => setMergeOpen(true)}
                    >
                      Merge ticket
                    </Button>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* ── Merge Dialog ─────────────────────────────────────────────────── */}
      {mergeOpen && (
        <MergeTicketDialog
          open
          onOpenChange={setMergeOpen}
          ticketId={ticket.id}
          ticketCode={ticket.code}
          suggestedTargetId={ticket.suspectedDuplicateOfTicketId}
        />
      )}

      {/* ── Declare Incident Dialog ──────────────────────────────────────── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as a major Incident?</AlertDialogTitle>
            <AlertDialogDescription>
              Ticket <strong>{ticket.code}</strong> will be marked as an
              Incident and handled under the highest-priority process. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="incident-description">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="incident-description"
              placeholder="Briefly describe why you're declaring an incident..."
              value={incidentDescription}
              onChange={(e) => setIncidentDescription(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirm}
              disabled={isPending || !incidentDescription.trim()}
            >
              {isPending ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminClosedOverrideDialog
        open={!!overrideTarget}
        onOpenChange={(open) => !open && setOverrideTarget(null)}
        mode={overrideTarget?.mode ?? "edit"}
        ticketId={ticketId}
        chat={overrideTarget?.chat ?? null}
      />
    </div>
  );
}
