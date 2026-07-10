import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import TicketStatusBadge from "@/shared/components/common/TicketStatusBadge";
import TypingIndicator from "@/shared/components/common/TypingIndicator";
import TicketPriorityBadge from "@/shared/components/common/TicketPriorityBadge";
import SlaCountdown from "@/features/manager/components/SlaCountdown";
import TriageDialog from "@/features/manager/components/TriageDialog";
import AssignDialog from "@/features/manager/components/AssignDialog";
import ReassignDialog from "@/features/manager/components/ReassignDialog";
import RejectDialog from "@/features/manager/components/RejectDialog";
import TriageRejectDialog from "@/features/manager/components/TriageRejectDialog";
import EscalateDialog from "@/features/manager/components/EscalateDialog";
import DeclareIncidentDialog from "@/features/manager/components/DeclareIncidentDialog";
import TicketActivityTimeline from "@/features/manager/components/TicketActivityTimeline";
import AddCommentForm from "@/features/manager/components/AddCommentForm";
import TicketAttachments from "@/shared/components/common/TicketAttachments";
import {
  TicketCommentThread,
  type ChatTab,
} from "@/shared/components/common/TicketCommentThread";
import { ProcessingDurationTimer } from "@/shared/components/common/ProcessingDurationTimer";
import BatteryAssetInfoPanel from "@/features/manager/components/BatteryAssetInfoPanel";
import {
  useManagerTicketDetail,
  useTicketActivities,
  useApproveTicket,
  useTicketComments,
} from "@/features/manager/hooks/useManagerTickets";
import { useTicketCommentsRealtime } from "@/shared/hooks/useTicketCommentsRealtime";
import {
  useUpdateTicketChat,
  useDeleteTicketChat,
  useMarkTicketChatsRead,
  useTranslateTicketChat,
} from "@/shared/hooks/useTicketChatActions";
import { checkPermission, P } from "@/shared/lib/authz";
import {
  TicketStatusEnum,
  ImpactScopeEnum,
  UrgencyLevelEnum,
  TicketCategoryEnum,
  EscalationReasonEnum,
} from "@/shared/types/ticket.types";
import TicketKbReferencesPanel from "@/features/manager/components/TicketKbReferencesPanel";
import { RefreshButton } from "@/shared/components/common/RefreshButton";
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

  const { data: ticket, isLoading, isError } = useManagerTicketDetail(id);
  const { data: activities = [], isLoading: activitiesLoading } =
    useTicketActivities(id);
  const { data: comments = [] } = useTicketComments(id);

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
  const user = useSessionStore((s) => s.user);
  const currentUserId = user?.accountId;
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
  const canTriage = status === TicketStatusEnum.Open;
  // triage-reject: Open|Escalated → ClosedRejected (BE verified — state machine
  // cho phép cả 2 source). Tách khỏi canTriage (chỉ Open) vốn dùng cho nút Triage.
  const canTriageReject = (
    [TicketStatusEnum.Open, TicketStatusEnum.Escalated] as TicketStatusEnum[]
  ).includes(status);
  const canAssign = status === TicketStatusEnum.Approved;
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
  const canDeclareIncident = !ticket.isIncident;

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
                <TabsTrigger value="comments">
                  Bình luận
                  {comments.length > 0 && ` (${comments.length})`}
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
              <BatteryAssetInfoPanel
                batteryAssetId={ticket.batteryAssetId}
                currentTicketId={id}
              />
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
                />
              </div>
              <div className="shrink-0 border-t border-border p-3">
                <TypingIndicator names={typingNames} />
                <AddCommentForm
                  ticketId={id}
                  onTyping={sendTyping}
                  isInternal={chatTab === "internal"}
                  existingFileIds={existingFileIds}
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

        {/* Collapsed rail — nút mở lại sidebar */}
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            title="Mở bảng thông tin"
            className="w-8 shrink-0 border-l border-border flex items-start justify-center pt-4 text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <PanelRightOpen className="size-4" />
          </button>
        )}

        {/* Right: Sidebar */}
        {sidebarOpen && (
          <div className="w-75 shrink-0 overflow-y-auto flex flex-col divide-y divide-border/60">
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
                value={format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", {
                  locale: vi,
                })}
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
                  value={format(new Date(ticket.closedAt), "dd/MM/yyyy HH:mm", {
                    locale: vi,
                  })}
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
        <AssignDialog ticketId={id} open onClose={() => setDialog(null)} />
      )}
      {dialog === "reassign" && (
        <ReassignDialog ticketId={id} open onClose={() => setDialog(null)} />
      )}
      {dialog === "reject" && (
        <RejectDialog ticketId={id} open onClose={() => setDialog(null)} />
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
