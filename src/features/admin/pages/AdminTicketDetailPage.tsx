import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/features/admin/hooks/ticket/useAdminTickets";
import AddCommentForm from "@/features/admin/components/ticket/AddCommentForm";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TicketVerifyBadge from "@/shared/components/ticket/TicketVerifyBadge";
import MergeTicketDialog from "@/features/admin/components/ticket/MergeTicketDialog";
import TypingIndicator from "@/shared/components/chat/TypingIndicator";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import TicketActivityTimeline from "@/features/admin/components/ticket/TicketActivityTimeline";
import AdminClosedOverrideDialog from "@/features/admin/components/ticket/AdminClosedOverrideDialog";
import TicketAttachments from "@/shared/components/ticket/TicketAttachments";
import ChatUnreadBadge from "@/shared/components/ticket/ChatUnreadBadge";
import type { TicketCommentDTO } from "@/shared/types/ticket/ticket.types";
import {
  TicketCommentThread,
  type ChatTab,
} from "@/shared/components/ticket/TicketCommentThread";
import { ProcessingDurationTimer } from "@/shared/components/ticket/ProcessingDurationTimer";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { useSessionStore } from "@/shared/stores/sessionStore";
import { checkPermission, P } from "@/shared/lib/authz";
import { useTicketCommentsRealtime } from "@/shared/hooks/ticket/useTicketCommentsRealtime";
import { useMentionCandidates } from "@/shared/hooks/ticket/useTicketParticipants";
import {
  useUpdateTicketChat,
  useDeleteTicketChat,
  useMarkTicketChatsRead,
  useTranslateTicketChat,
} from "@/shared/hooks/ticket/useTicketChatActions";
import { TicketStatusEnum } from "@/shared/types/ticket/ticket.types";
import { slaBarColorClass } from "@/shared/lib/sla";

const CATEGORY_LABELS: Record<string, string> = {
  Charging: "Lỗi sạc",
  Overheat: "Quá nhiệt",
  NoPower: "Không điện",
  Performance: "Hiệu suất",
  Repair: "Sửa chữa",
  Other: "Khác",
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

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketId = id ?? "";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [incidentDescription, setIncidentDescription] = useState("");
  const [chatTab, setChatTab] = useState<ChatTab>("public");
  const [composerPrefill, setComposerPrefill] = useState({
    text: "",
    version: 0,
  });
  // GH-133 C4 — Admin override sửa/xóa chat trên ticket đã Closed.
  const [overrideTarget, setOverrideTarget] = useState<{
    chat: TicketCommentDTO;
    mode: "edit" | "delete";
  } | null>(null);

  const { data: ticket, isLoading: loadingDetail } = useAdminTicketDetail(id!);
  const { data: activities = [], isLoading: loadingActivities } =
    useAdminTicketActivities(id!);
  const { data: comments = [] } = useAdminTicketComments(ticketId);

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
  // Người có thể @-tag: participant active của ticket (GET .../participants).
  // KHÔNG dùng tác giả đã chat — người mới add vào ticket chưa nhắn gì vẫn phải tag được.
  const mentionCandidates = useMentionCandidates(ticketId);
  const { typingNames, sendTyping } = useTicketCommentsRealtime(ticketId);
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
      <div className="p-6 space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-[calc(100vh-150px)] w-full rounded-xl" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Không tìm thấy ticket.</p>
        <Button variant="outline" onClick={() => navigate("/admin/tickets")}>
          Quay lại
        </Button>
      </div>
    );
  }

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
              {ticket.isIncident && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle size={10} className="mr-1" />
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

        <div className="flex items-center gap-2">
          <RefreshButton
            queryKeys={[KEY.admin.tickets, KEY.tickets]}
            size="icon"
          />
          <Button
            variant="destructive"
            size="sm"
            disabled={ticket.isIncident || isPending}
            onClick={() => setConfirmOpen(true)}
          >
            <AlertTriangle size={13} />
            {ticket.isIncident ? "Đã là Incident" : "Declare Incident"}
          </Button>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Timeline / Bình luận */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          <Tabs defaultValue="timeline" className="h-full gap-0">
            <div className="px-6 py-2.5 border-b border-border shrink-0">
              <TabsList>
                <TabsTrigger value="timeline">Lịch sử hoạt động</TabsTrigger>
                {/* `group` để ChatUnreadBadge tự ẩn khi tab này đang active. */}
                <TabsTrigger value="comments" className="group">
                  Bình luận
                  <ChatUnreadBadge ticketId={id ?? ""} />
                </TabsTrigger>
              </TabsList>
            </div>

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
                <TicketActivityTimeline activities={activities} />
              )}
            </TabsContent>

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
                  ticketClosed={ticket.status === TicketStatusEnum.Closed}
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
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Sidebar */}
        <div className="w-75 shrink-0 overflow-y-auto flex flex-col divide-y divide-border/60">
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
                  <span className="text-xs font-medium">
                    {ticket.slaTimer.status}
                  </span>
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
                  <span className="text-xs text-muted-foreground">Còn lại</span>
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
                Chưa có SLA timer.
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
                <span className="text-xs text-muted-foreground">Hiện tại</span>
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

          {/* Attachments */}
          {ticket.attachmentFileIds && ticket.attachmentFileIds.length > 0 && (
            <div className="p-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Tệp đính kèm
              </p>
              <TicketAttachments fileIds={ticket.attachmentFileIds} />
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
              <p className="text-xs leading-relaxed whitespace-pre-wrap">
                {ticket.resolutionSummary}
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="px-4 py-1">
            <SideInfoRow
              label="Danh mục"
              value={CATEGORY_LABELS[ticket.category] ?? ticket.category}
            />
            <SideInfoRow label="Nguồn" value={ticket.origin} />
            <SideInfoRow label="Phạm vi" value={ticket.impactScope ?? null} />
            <SideInfoRow label="Khẩn cấp" value={ticket.urgencyLevel ?? null} />
            <SideInfoRow
              label="Serial pin"
              value={ticket.batterySerialNumber ?? null}
            />
            <SideInfoRow
              label="Ngày tạo"
              value={format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", {
                locale: vi,
              })}
            />
            {ticket.detectedAt && (
              <SideInfoRow
                label="Phát hiện lúc"
                value={format(new Date(ticket.detectedAt), "dd/MM/yyyy HH:mm", {
                  locale: vi,
                })}
              />
            )}
            {/* #698 — khoảng thời gian Customer phát hiện sự cố. */}
            {ticket.incidentDetectedFrom && (
              <SideInfoRow
                label="Sự cố từ"
                value={format(
                  new Date(ticket.incidentDetectedFrom),
                  "dd/MM/yyyy HH:mm",
                  { locale: vi },
                )}
              />
            )}
            {ticket.incidentDetectedTo && (
              <SideInfoRow
                label="Sự cố đến"
                value={format(
                  new Date(ticket.incidentDetectedTo),
                  "dd/MM/yyyy HH:mm",
                  { locale: vi },
                )}
              />
            )}
            {ticket.updatedAt && (
              <SideInfoRow
                label="Cập nhật"
                value={format(new Date(ticket.updatedAt), "dd/MM/yyyy HH:mm", {
                  locale: vi,
                })}
              />
            )}
          </div>

          {/* ── AI verify + nghi trùng (chỉ ticket Customer tạo thủ công) ── */}
          {ticket.origin === "ManualByCustomer" &&
            (ticket.aiVerifyStatus || ticket.suspectedDuplicateOfTicketId) && (
              <div className="px-4 py-3 space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                      onClick={() => setMergeOpen(true)}
                    >
                      Gộp ticket
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
            <AlertDialogTitle>
              Đánh dấu là Incident nghiêm trọng?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ticket <strong>{ticket.code}</strong> sẽ được đánh dấu là Incident
              và xử lý theo quy trình ưu tiên cao nhất. Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="incident-description">
              Mô tả lý do <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="incident-description"
              placeholder="Mô tả ngắn lý do declare incident..."
              value={incidentDescription}
              onChange={(e) => setIncidentDescription(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirm}
              disabled={isPending || !incidentDescription.trim()}
            >
              {isPending ? "Đang xử lý..." : "Xác nhận"}
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
