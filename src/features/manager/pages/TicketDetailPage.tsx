import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TicketVerifyBadge from "@/shared/components/ticket/TicketVerifyBadge";
import TypingIndicator from "@/shared/components/chat/TypingIndicator";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import SlaCountdown from "@/features/manager/components/ticket/SlaCountdown";
import TriageDialog from "@/features/manager/components/ticket/TriageDialog";
import AssignDialog from "@/features/manager/components/ticket/AssignDialog";
import ReassignDialog from "@/features/manager/components/ticket/ReassignDialog";
import RejectDialog from "@/features/manager/components/ticket/RejectDialog";
import TriageRejectDialog from "@/features/manager/components/ticket/TriageRejectDialog";
import EscalateDialog from "@/features/manager/components/ticket/EscalateDialog";
import ReprioritizeDialog from "@/features/manager/components/ticket/ReprioritizeDialog";
import DeclareIncidentDialog from "@/features/manager/components/ticket/DeclareIncidentDialog";
import TicketActivityTimeline from "@/features/manager/components/ticket/TicketActivityTimeline";
import AddCommentForm from "@/features/manager/components/ticket/AddCommentForm";
import TicketAttachments from "@/shared/components/ticket/TicketAttachments";
import ChatUnreadBadge from "@/shared/components/ticket/ChatUnreadBadge";
import {
  TicketCommentThread,
  type ChatTab,
} from "@/shared/components/ticket/TicketCommentThread";
import { ProcessingDurationTimer } from "@/shared/components/ticket/ProcessingDurationTimer";
import BatteryAssetInfoPanel from "@/features/manager/components/battery/BatteryAssetInfoPanel";
import {
  useManagerTicketDetail,
  useTicketActivities,
  useApproveTicket,
  useTicketComments,
  useReVerifyTicket,
} from "@/features/manager/hooks/ticket/useManagerTickets";
import { useStaffAssignmentList } from "@/features/manager/hooks/ticket/useStaffAssignmentList";
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
import { checkPermission, P } from "@/shared/lib/authz";
import {
  TicketStatusEnum,
  ImpactScopeEnum,
  UrgencyLevelEnum,
  TicketCategoryEnum,
  EscalationReasonEnum,
} from "@/shared/types/ticket/ticket.types";
import {
  getPrimaryHandler,
  getSupporters,
} from "@/shared/utils/ticket/assignments";
import TicketKbReferencesPanel from "@/features/manager/components/ticket/TicketKbReferencesPanel";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { slaBarColorClass } from "@/shared/lib/sla";
import { KEY } from "@/shared/utils/queryKeys";
import { useSessionStore } from "@/shared/stores/sessionStore";

type DialogType =
  | "triage"
  | "triage-reject"
  | "assign"
  | "reassign"
  | "reject"
  | "escalate"
  | "reprioritize"
  | "incident"
  | null;

const CATEGORY_LABEL: Partial<Record<TicketCategoryEnum, string>> = {
  Charging: "Sạc",
  Overheat: "Quá nhiệt",
  NoPower: "Không điện",
  Performance: "Hiệu suất",
  Repair: "Sửa chữa",
  Other: "Khác",
};

const IMPACT_LABEL: Record<ImpactScopeEnum, string> = {
  SingleAsset: "Single Asset",
  Site: "Site",
  MultiSite: "Multi Site",
};

const URGENCY_LABEL: Record<UrgencyLevelEnum, string> = {
  Low: "Thấp",
  Medium: "Trung bình",
  High: "Cao",
};

const ESCALATION_REASON_LABEL: Record<EscalationReasonEnum, string> = {
  SkillGap: "Thiếu kỹ năng xử lý",
  PartsRequired: "Cần linh kiện thay thế",
  SafetyConcern: "Nguy cơ an toàn",
  SlaBreach: "Vi phạm SLA",
  CustomerComplaint: "Khách hàng khiếu nại",
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
  const [dialog, setDialog] = useState<DialogType>(null);
  const [chatTab, setChatTab] = useState<ChatTab>("public");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [composerPrefill, setComposerPrefill] = useState({
    text: "",
    version: 0,
  });

  const { data: ticket, isLoading, isError } = useManagerTicketDetail(id);
  const { data: activities = [], isLoading: activitiesLoading } =
    useTicketActivities(id);
  const { data: comments = [] } = useTicketComments(id);
  const { data: staffList = [] } = useStaffAssignmentList();

  // #697 — assignments thay cho assignedStaffId: 1 PrimaryHandler + N Supporter.
  // staffId chưa có trong staff list (đã nghỉ/ẩn) → fallback hiện UUID.
  const { primaryHandlerName, supporterNames } = useMemo(() => {
    const nameOf = (staffId: string) =>
      staffList.find((s) => s.accountId === staffId)?.fullName ?? staffId;
    const primary = getPrimaryHandler(ticket?.assignments);
    return {
      primaryHandlerName: primary ? nameOf(primary.staffId) : null,
      supporterNames: getSupporters(ticket?.assignments).map((a) =>
        nameOf(a.staffId),
      ),
    };
  }, [ticket?.assignments, staffList]);

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
  const { typingNames, sendTyping } = useTicketCommentsRealtime(id);
  const { mutate: approve, isPending: approving } = useApproveTicket(id);
  const reVerify = useReVerifyTicket(id);
  const user = useSessionStore((s) => s.user);
  const currentUserId = user?.accountId;
  // Người có thể @-tag: participant active của ticket (GET .../participants).
  // KHÔNG dùng tác giả đã chat — người mới add vào ticket chưa nhắn gì vẫn phải tag được.
  const mentionCandidates = useMentionCandidates(id);
  const { mutate: updateChat, isPending: editChatPending } =
    useUpdateTicketChat();
  const { mutate: deleteChat, isPending: deleteChatPending } =
    useDeleteTicketChat();
  const { mutate: markChatsRead } = useMarkTicketChatsRead();
  const handleMarkRead = (chatIds: string[]) =>
    markChatsRead({ ticketId: id, payload: { chatIds } });
  const { mutateAsync: translateChat } = useTranslateTicketChat();
  const handleTranslate = (chat: { id: string }, targetLanguage: string) =>
    translateChat({ ticketId: id, chatId: chat.id, targetLanguage });

  // Outbox chat: worker gửi tuần tự + retry; composer enqueue; thread render pending.
  const {
    pending: pendingChats,
    retry: retryChat,
    discard: discardChat,
  } = useChatSender(id, managerTicketService.addComment);

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive mb-4">
          Không tìm thấy ticket hoặc bạn không có quyền truy cập.
        </p>
        <Button variant="outline" onClick={() => navigate("/manager/tickets")}>
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

  const status = ticket.status;
  // Triage = New → Open (TransitionRuleProvider, Manager/Admin/System). Trước đây
  // gate nhầm sang Open: queue chỉ trả ticket New nên nút không bao giờ hiện.
  const canTriage = status === TicketStatusEnum.New;
  // triage-reject: New|Escalated → ClosedRejected — rule provider có cả 2 source.
  // Đổi Open→New theo cùng lý do canTriage; giữ nguyên nhánh Escalated.
  const canTriageReject = (
    [TicketStatusEnum.New, TicketStatusEnum.Escalated] as TicketStatusEnum[]
  ).includes(status);
  // Assign = Open → Assigned. Trước đây gate theo 'Approved' — status này KHÔNG
  // tồn tại ở BE (chỉ có ActivityActionEnum.Approved) nên nút không bao giờ hiện.
  const canAssign = status === TicketStatusEnum.Open;
  const canReassign = (
    [
      TicketStatusEnum.Assigned,
      TicketStatusEnum.InProgress,
      TicketStatusEnum.Escalated,
    ] as TicketStatusEnum[]
  ).includes(status);
  const canApprove = status === TicketStatusEnum.Resolved;
  const canReject = status === TicketStatusEnum.Resolved;
  // Escalate = thêm nhân lực/cấp bậc khi ticket ĐANG được xử lý. Siết allow-list
  // (thay vì "mọi status trừ Closed") để nút không hiện ở New/Open/Approved/
  // Resolved/ClosedRejected — nơi escalate vô nghĩa (chưa triage/đã xong).
  const canEscalate = (
    [
      TicketStatusEnum.Assigned,
      TicketStatusEnum.InProgress,
      TicketStatusEnum.WaitingCustomer,
      TicketStatusEnum.WaitingParts,
      TicketStatusEnum.WaitingOnsiteSchedule,
      TicketStatusEnum.Escalated,
    ] as TicketStatusEnum[]
  ).includes(status);
  // Whitelist khớp TicketReprioritizeCommandHandler: mọi status ngoài 4 giá trị
  // này đều bị BE trả 409 (kể cả Waiting* — khác allow-list của Escalate).
  const canReprioritize = (
    [
      TicketStatusEnum.Open,
      TicketStatusEnum.Assigned,
      TicketStatusEnum.InProgress,
      TicketStatusEnum.Escalated,
    ] as TicketStatusEnum[]
  ).includes(status);
  const canDeclareIncident = !ticket.isIncident;
  // Gộp ticket: ticket NGUỒN (bị gộp đi) phải còn New — chưa triage, chưa gán ai.
  // Đã triage = Manager đã quyết định xử lý riêng → không cho gộp nữa. Đây cũng là
  // cách Manager "tách" 1 ticket nghi trùng: chỉ cần triage nó là nút Gộp biến mất.
  const canMerge =
    !ticket.mergedIntoTicketId && status === TicketStatusEnum.New;

  // comments lấy từ query riêng (useTicketComments) + realtime push (SignalR).

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
            onClick={() => navigate("/manager/tickets")}
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
            queryKeys={[KEY.manager.tickets, KEY.tickets]}
            size="icon"
          />
          {canTriage && (
            <Button size="sm" onClick={() => setDialog("triage")}>
              Triage
            </Button>
          )}
          {canAssign && (
            <Button size="sm" onClick={() => setDialog("assign")}>
              Gán Staff
            </Button>
          )}
          {canReassign && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialog("reassign")}
            >
              Điều chuyển
            </Button>
          )}
          {canApprove && (
            <Button
              size="sm"
              onClick={() => approve(undefined)}
              disabled={approving}
            >
              {approving ? "Đang xử lý..." : "Phê duyệt"}
            </Button>
          )}
          {canReject && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDialog("reject")}
            >
              Từ chối
            </Button>
          )}
          {canEscalate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialog("escalate")}
            >
              Chuyển cấp
            </Button>
          )}
          {canReprioritize && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialog("reprioritize")}
            >
              Đổi mức ưu tiên
            </Button>
          )}
          {canDeclareIncident && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDialog("incident")}
            >
              Khai báo Incident
            </Button>
          )}
          {canTriageReject && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDialog("triage-reject")}
            >
              Từ chối (Triage)
            </Button>
          )}
          {canMerge && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/manager/tickets/${id}/merge`)}
            >
              Gộp ticket
            </Button>
          )}
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Tabs */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          <Tabs defaultValue="info" className="h-full gap-0">
            <div className="px-6 py-2.5 border-b border-border shrink-0">
              <TabsList>
                <TabsTrigger value="info">Thông tin</TabsTrigger>
                {/* `group` để ChatUnreadBadge tự ẩn khi tab này đang active. */}
                <TabsTrigger value="comments" className="group">
                  Bình luận
                  <ChatUnreadBadge ticketId={id} />
                </TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="kb">Bài viết KB</TabsTrigger>
              </TabsList>
            </div>

            {/* Info — battery asset info + attachments */}
            <TabsContent
              value="info"
              className="min-h-0 overflow-y-auto m-0 p-6 space-y-6"
            >
              {/* Ticket có thể gắn nhiều pin — lặp từng pin. Fallback pin đơn (legacy). */}
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
                        {ids.length} thiết bị pin liên quan
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
                  Tệp đính kèm
                </p>
                {ticket.attachmentFileIds &&
                ticket.attachmentFileIds.length > 0 ? (
                  <TicketAttachments fileIds={ticket.attachmentFileIds} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Không có tệp đính kèm.
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
                  comments={comments}
                  currentUserId={currentUserId}
                  activeTab={chatTab}
                  onTabChange={setChatTab}
                  canEditAny={checkPermission(user, P.CHAT_EDIT_ANY)}
                  canDeleteAny={checkPermission(user, P.CHAT_DELETE_ANY)}
                  ticketClosed={status === TicketStatusEnum.Closed}
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
                <TicketActivityTimeline activities={activities} />
              )}
            </TabsContent>

            {/* KB */}
            <TabsContent value="kb" className="min-h-0 overflow-y-auto m-0 p-6">
              <TicketKbReferencesPanel
                ticketId={id}
                afterResolveOnly={status === TicketStatusEnum.Resolved}
                defaultCategory={ticket.category}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Sidebar — luôn mount, animate width (đồng bộ sidebar trái) */}
        <aside
          className={cn(
            "shrink-0 border-l border-border overflow-hidden",
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
              {/* ── AI verify + nghi trùng (chỉ ticket Customer tạo thủ công) ──
                  Đặt TRÊN CÙNG: Manager cần đọc nhận định AI + cảnh báo trùng
                  trước khi triage, không phải cuộn xuống đáy mới thấy. */}
              {ticket.origin === "ManualByCustomer" &&
                (ticket.aiVerifyStatus ||
                  ticket.suspectedDuplicateOfTicketId) && (
                  <div className="px-4 py-3 space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Kiểm tra AI
                    </p>
                    {ticket.aiVerifyStatus && (
                      <div className="flex items-center gap-2">
                        <TicketVerifyBadge
                          status={ticket.aiVerifyStatus}
                          origin={ticket.origin}
                        />
                        {ticket.aiVerifyScore != null && (
                          <span className="text-xs text-muted-foreground">
                            {(ticket.aiVerifyScore * 100).toFixed(0)}% hợp lệ
                          </span>
                        )}
                      </div>
                    )}
                    {ticket.aiVerifyReason && (
                      <p className="text-xs text-muted-foreground">
                        {ticket.aiVerifyReason}
                      </p>
                    )}
                    {/* Nút kích hoạt AI kiểm tra lại — chỉ khi Skipped/Pending. */}
                    {(ticket.aiVerifyStatus === "Skipped" ||
                      ticket.aiVerifyStatus === "Pending") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        disabled={reVerify.isPending}
                        onClick={() => reVerify.mutate()}
                      >
                        {reVerify.isPending ? "Đang gửi…" : "AI kiểm tra lại"}
                      </Button>
                    )}
                    {ticket.suspectedDuplicateOfTicketId && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                        <p className="font-medium">⚠ Nghi trùng ticket khác</p>
                        {ticket.duplicateReason && (
                          <p className="mt-0.5">{ticket.duplicateReason}</p>
                        )}
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
                          Gộp ticket
                        </Button>
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

              {/* Rejection reason */}
              {ticket.rejectionReason && (
                <div className="p-4">
                  <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider mb-2">
                    Lý do từ chối
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
                    Kết quả giải quyết
                  </p>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap mb-2">
                    {ticket.resolutionSummary}
                  </p>
                  {ticket.resolvedAt && (
                    <p className="text-[10.5px] text-emerald-700/70 dark:text-emerald-400/70">
                      Xử lý xong lúc{" "}
                      {format(new Date(ticket.resolvedAt), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Escalation */}
              {ticket.escalatedAt && (
                <div className="p-4 bg-orange-50/50 dark:bg-orange-950/10">
                  <p className="text-[10px] font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-2">
                    Chuyển cấp
                  </p>
                  {ticket.escalationReason && (
                    <p className="text-xs leading-relaxed">
                      {ESCALATION_REASON_LABEL[ticket.escalationReason] ??
                        ticket.escalationReason}
                    </p>
                  )}
                  <p className="text-[10.5px] text-orange-700/70 dark:text-orange-400/70 mt-1">
                    {format(new Date(ticket.escalatedAt), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </p>
                </div>
              )}

              {/* Customer rating */}
              {ticket.rating != null && (
                <div className="p-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Đánh giá khách hàng
                  </p>
                  <p className="text-xs font-medium">
                    {"★".repeat(ticket.rating)}
                    {"☆".repeat(5 - ticket.rating)}
                    <span className="text-muted-foreground font-normal ml-1">
                      ({ticket.rating}/5)
                    </span>
                  </p>
                  {ticket.ratingComment && (
                    <p className="text-xs leading-relaxed text-foreground/90 mt-1.5 whitespace-pre-wrap">
                      {ticket.ratingComment}
                    </p>
                  )}
                </div>
              )}

              {/* Meta */}
              <div className="px-4 py-1 divide-y divide-border/50">
                <SideInfoRow
                  label="Danh mục"
                  value={CATEGORY_LABEL[ticket.category] ?? ticket.category}
                />
                <SideInfoRow label="Nguồn" value={ticket.origin} />
                <SideInfoRow
                  label="Phụ trách chính"
                  value={primaryHandlerName}
                />
                {supporterNames.length > 0 && (
                  <SideInfoRow
                    label="Hỗ trợ"
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
                <SideInfoRow
                  label="Serial pin"
                  value={ticket.batterySerialNumber ?? null}
                />
                {ticket.detectedAt && (
                  <SideInfoRow
                    label="Phát hiện lúc"
                    value={format(
                      new Date(ticket.detectedAt),
                      "dd/MM/yyyy HH:mm",
                      { locale: vi },
                    )}
                  />
                )}
                {/* GH-866 — 1 mốc thời gian phát hiện sự cố (thay cặp from/to cũ). */}
                {ticket.detectedAt && (
                  <SideInfoRow
                    label="Phát hiện lúc"
                    value={format(
                      new Date(ticket.detectedAt),
                      "dd/MM/yyyy HH:mm",
                      { locale: vi },
                    )}
                  />
                )}
                <SideInfoRow
                  label="Phạm vi"
                  value={
                    ticket.impactScope
                      ? (IMPACT_LABEL[ticket.impactScope] ?? ticket.impactScope)
                      : null
                  }
                />
                <SideInfoRow
                  label="Khẩn cấp"
                  value={
                    ticket.urgencyLevel
                      ? (URGENCY_LABEL[ticket.urgencyLevel] ??
                        ticket.urgencyLevel)
                      : null
                  }
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
                {ticket.updatedAt && (
                  <SideInfoRow
                    label="Cập nhật"
                    value={format(
                      new Date(ticket.updatedAt),
                      "dd/MM/yyyy HH:mm",
                      {
                        locale: vi,
                      },
                    )}
                  />
                )}
                {ticket.approvedAt && (
                  <SideInfoRow
                    label="Duyệt lúc"
                    value={format(
                      new Date(ticket.approvedAt),
                      "dd/MM/yyyy HH:mm",
                      {
                        locale: vi,
                      },
                    )}
                  />
                )}
                {ticket.closedAt && (
                  <SideInfoRow
                    label="Đóng lúc"
                    value={format(
                      new Date(ticket.closedAt),
                      "dd/MM/yyyy HH:mm",
                      {
                        locale: vi,
                      },
                    )}
                  />
                )}
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
      {dialog === "triage" && (
        <TriageDialog ticketId={id} open onClose={() => setDialog(null)} />
      )}
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
      {dialog === "reprioritize" && (
        <ReprioritizeDialog
          ticketId={id}
          currentPriority={ticket.priority}
          open
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "escalate" && (
        <EscalateDialog ticketId={id} open onClose={() => setDialog(null)} />
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
