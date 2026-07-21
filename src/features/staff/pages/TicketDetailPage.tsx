import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TicketStatusEnum } from "@/shared/types/ticket/ticket.types";
import { slaBarColorClass } from "@/shared/lib/sla";
import type { MaintenanceLogDTO } from "@/shared/types/ticket/ticket.types";
import {
  useStaffTicketDetail,
  useStaffTicketActivities,
  useStaffTicketComments,
} from "@/features/staff/hooks/ticket/useStaffTicketDetail";
import {
  useStartTicket,
  useHoldTicket,
  useResumeTicket,
  useResolveTicket,
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
import { TicketTimeline } from "@/features/staff/components/ticket/TicketTimeline";
import { AddCommentForm } from "@/features/staff/components/ticket/AddCommentForm";
import { MaintenanceLogDialog } from "@/features/staff/components/ticket/MaintenanceLogDialog";
import { EditMaintenanceLogDialog } from "@/features/staff/components/ticket/EditMaintenanceLogDialog";
import TicketAttachments from "@/shared/components/ticket/TicketAttachments";
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
import { checkPermission, P } from "@/shared/lib/authz";
import { useTicketCommentsRealtime } from "@/shared/hooks/ticket/useTicketCommentsRealtime";
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

const WAITING_STATUSES = [
  TicketStatusEnum.WaitingCustomer,
  TicketStatusEnum.WaitingParts,
  TicketStatusEnum.WaitingOnsiteSchedule,
];

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
  // Tab chat: bình luận mới gửi theo tab đang mở (public/internal).
  const [chatTab, setChatTab] = useState<ChatTab>("public");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [composerPrefill, setComposerPrefill] = useState({
    text: "",
    version: 0,
  });

  const ticketId = id ?? "";
  const user = useSessionStore((s) => s.user);
  const currentUserId = user?.accountId;

  // Realtime: invalidate tickets.chats khi ChatAdded (cùng key với useStaffTicketComments)
  // + typing indicator (typingNames render "đang gõ", sendTyping báo khi mình gõ).
  const { typingNames, sendTyping } = useTicketCommentsRealtime(ticketId);

  const { data: ticket, isLoading, isError } = useStaffTicketDetail(ticketId);
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

  const startMutation = useStartTicket(ticketId);
  const holdMutation = useHoldTicket(ticketId);
  const resumeMutation = useResumeTicket(ticketId);
  const resolveMutation = useResolveTicket(ticketId);
  const escalateMutation = useEscalateTicket(ticketId);
  // Outbox chat: worker gửi tuần tự + retry; composer chỉ enqueue.
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
          Không tìm thấy ticket hoặc bạn không có quyền truy cập.
        </p>
        <Button variant="outline" onClick={() => navigate("/staff/tickets")}>
          Quay lại danh sách
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
  const isAssigned = status === TicketStatusEnum.Assigned;
  const isInProgress = status === TicketStatusEnum.InProgress;
  const isWaiting = WAITING_STATUSES.includes(
    status as (typeof WAITING_STATUSES)[number],
  );
  const canComment = isInProgress || isWaiting || isAssigned;
  const canAddLog = isInProgress || isWaiting;
  // Khoá sửa log khi ticket đã Resolved/ClosedPendingRate/Closed (BE enforce).
  const canEditLog = isInProgress || isWaiting;
  // Gắn KB reference: khớp BE (AddTicketKbReferenceCommandHandler) — chặn từ
  // ClosedPendingRate/Closed. Ở Resolved vẫn cho gắn nhưng CHỈ 2 type
  // after-resolve (GeneratedAfterResolve/ProvidedToCustomer) — guard H.
  const canAddKb = !(
    [
      TicketStatusEnum.ClosedPendingRate,
      TicketStatusEnum.Closed,
    ] as TicketStatusEnum[]
  ).includes(status);
  const kbAfterResolveOnly = status === TicketStatusEnum.Resolved;

  const handleHoldSubmit = (data: HoldFormValues) => {
    holdMutation.mutate(data, { onSuccess: () => setHoldOpen(false) });
  };

  const handleResolveSubmit = (data: ResolveFormValues) => {
    resolveMutation.mutate(data, { onSuccess: () => setResolveOpen(false) });
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
                  Sự cố
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
          {isAssigned && (
            <Button
              size="sm"
              onClick={() => startMutation.mutate(undefined)}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending ? "Đang xử lý..." : "Bắt đầu xử lý"}
            </Button>
          )}
          {isInProgress && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHoldOpen(true)}
              >
                Tạm dừng
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResolveOpen(true)}
              >
                Báo hoàn thành
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEscalateOpen(true)}
              >
                Yêu cầu chuyển cấp
              </Button>
            </>
          )}
          {isWaiting && (
            <Button
              size="sm"
              onClick={() => resumeMutation.mutate(undefined)}
              disabled={resumeMutation.isPending}
            >
              {resumeMutation.isPending ? "Đang xử lý..." : "Tiếp tục xử lý"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Tabs */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          <Tabs defaultValue="timeline" className="h-full gap-0">
            <div className="px-6 py-2.5 border-b border-border shrink-0">
              <TabsList>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="comments">
                  Bình luận
                  {comments.length > 0 && ` (${comments.length})`}
                </TabsTrigger>
                <TabsTrigger value="logs">
                  Nhật ký{logs.length > 0 && ` (${logs.length})`}
                </TabsTrigger>
                <TabsTrigger value="sub-issues">Sub Issue</TabsTrigger>
                <TabsTrigger value="kb">Bài viết KB</TabsTrigger>
              </TabsList>
            </div>

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
                <TicketTimeline activities={activities} />
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
                  canEditAny={checkPermission(user, P.CHAT_EDIT_ANY)}
                  canDeleteAny={checkPermission(user, P.CHAT_DELETE_ANY)}
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
                    + Thêm nhật ký
                  </Button>
                </div>
              )}
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Chưa có nhật ký bảo trì.
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
                              "dd/MM/yyyy HH:mm",
                              { locale: vi },
                            )}
                          </p>
                          {canEditLog && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setEditingLog(log)}
                            >
                              Sửa
                            </Button>
                          )}
                        </div>
                      </div>
                      {log.summary && (
                        <p className="font-medium">{log.summary}</p>
                      )}
                      {log.diagnosisDetails && (
                        <p className="text-muted-foreground">
                          Chẩn đoán: {log.diagnosisDetails}
                        </p>
                      )}
                      {log.actionsTaken && (
                        <p className="text-muted-foreground">
                          Hành động: {log.actionsTaken}
                        </p>
                      )}
                      {log.durationMinutes > 0 && (
                        <p className="text-muted-foreground">
                          Thời lượng: {log.durationMinutes} phút
                        </p>
                      )}
                      {log.attachmentFileIds &&
                        log.attachmentFileIds.length > 0 && (
                          <TicketAttachments
                            fileIds={log.attachmentFileIds}
                            label="Ảnh đính kèm"
                            compact
                          />
                        )}
                      {log.beforePhotosFileIds &&
                        log.beforePhotosFileIds.length > 0 && (
                          <TicketAttachments
                            fileIds={log.beforePhotosFileIds}
                            label="Ảnh trước"
                            compact
                          />
                        )}
                      {log.afterPhotosFileIds &&
                        log.afterPhotosFileIds.length > 0 && (
                          <TicketAttachments
                            fileIds={log.afterPhotosFileIds}
                            label="Ảnh sau"
                            compact
                          />
                        )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Sub Issue — staff tự chia nhỏ ticket thành các việc con */}
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

        {/* Right: Sidebar — luôn mount, animate width (đồng bộ sidebar trái) */}
        <aside
          className={cn(
            "shrink-0 border-l border-border overflow-hidden transition-all duration-200",
            sidebarOpen ? "w-75" : "w-8",
          )}
        >
          {/* Collapsed rail — nút mở lại bảng thông tin */}
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              title="Mở bảng thông tin"
              className="w-8 h-full flex items-start justify-center pt-4 text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <PanelRightOpen className="size-4" />
            </button>
          )}

          {/* Nội dung bảng — chỉ hiện khi mở, width cố định w-75 để không reflow lúc trượt */}
          {sidebarOpen && (
            <div className="w-75 h-full overflow-y-auto flex flex-col divide-y divide-border/60">
              {/* Header — nút thu gọn */}
              <div className="flex items-center justify-between px-4 py-2 shrink-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Thông tin
                </p>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  title="Thu gọn bảng thông tin"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <PanelRightClose className="size-4" />
                </button>
              </div>
              {/* SLA */}
              <div className="p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  SLA
                </p>
                {ticket.slaTimer ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Trạng thái
                      </span>
                      <SlaCountdown slaTimer={ticket.slaTimer} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Deadline
                      </span>
                      <span className="text-xs font-medium tabular-nums">
                        {format(new Date(ticket.slaTimer.dueAt), "dd/MM HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Còn lại
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
                    Chưa được triage.
                  </p>
                )}
              </div>

              {/* Trạng thái + thời gian xử lý */}
              <div className="p-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Trạng thái
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Hiện tại
                    </span>
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Thời gian xử lý
                    </span>
                    <ProcessingDurationTimer
                      activities={activities}
                      status={ticket.status}
                    />
                  </div>
                </div>
              </div>

              {/* Thiết bị pin — site/khách hàng/pin gắn với ticket */}
              <div className="p-4">
                <BatteryAssetInfoPanel batteryAssetId={ticket.batteryAssetId} />
              </div>

              {/* Description */}
              {ticket.description && (
                <div className="p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Mô tả
                  </p>
                  <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </div>
              )}

              {/* Attachments (ảnh khách đính kèm khi tạo ticket) */}
              {ticket.attachmentFileIds &&
                ticket.attachmentFileIds.length > 0 && (
                  <div className="p-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Ảnh đính kèm
                    </p>
                    <TicketAttachments
                      fileIds={ticket.attachmentFileIds}
                      label={null}
                      compact
                    />
                  </div>
                )}

              {/* Resolution */}
              {ticket.resolutionSummary && (
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10">
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
                    Tóm tắt giải quyết
                  </p>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">
                    {ticket.resolutionSummary}
                  </p>
                </div>
              )}

              {/* Meta */}
              <div className="px-4 py-1 divide-y divide-border/50">
                <SideInfoRow label="Danh mục" value={ticket.category} />
                <SideInfoRow label="Nguồn" value={ticket.origin} />
                <SideInfoRow
                  label="Phạm vi"
                  value={ticket.impactScope ?? null}
                />
                <SideInfoRow
                  label="Khẩn cấp"
                  value={ticket.urgencyLevel ?? null}
                />
                <SideInfoRow
                  label="Ngày tạo"
                  value={format(
                    new Date(ticket.createdAt),
                    "dd/MM/yyyy HH:mm",
                    {
                      locale: vi,
                    },
                  )}
                />
                {ticket.reopenCount > 0 && (
                  <SideInfoRow
                    label="Mở lại"
                    value={`${ticket.reopenCount} lần`}
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
        isPending={resolveMutation.isPending}
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
