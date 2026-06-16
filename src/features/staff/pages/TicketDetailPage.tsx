import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TicketStatusEnum } from "@/shared/types/ticket.types";
import {
  useStaffTicketDetail,
  useStaffTicketActivities,
} from "../hooks/useStaffTicketDetail";
import {
  useStartTicket,
  useHoldTicket,
  useResumeTicket,
  useResolveTicket,
  useEscalateTicket,
  useAddComment,
  useAddMaintenanceLog,
} from "../hooks/useStaffTicketMutations";
import { TicketStatusBadge } from "../components/TicketStatusBadge";
import { TicketPriorityBadge } from "../components/TicketPriorityBadge";
import { SlaCountdown } from "../components/SlaCountdown";
import { HoldDialog } from "../components/HoldDialog";
import { ResolveDialog } from "../components/ResolveDialog";
import { EscalateRequestDialog } from "../components/EscalateRequestDialog";
import { TicketTimeline } from "../components/TicketTimeline";
import { AddCommentForm } from "../components/AddCommentForm";
import { MaintenanceLogDialog } from "../components/MaintenanceLogDialog";
import TicketKbReferencesPanel from "../components/TicketKbReferencesPanel";
import type { HoldFormValues } from "../schemas/staff-ticket.schema";
import type { ResolveFormValues } from "../schemas/staff-ticket.schema";
import type { EscalateRequestFormValues } from "../schemas/staff-ticket.schema";
import type { AddCommentFormValues } from "../schemas/staff-ticket.schema";
import type { MaintenanceLogFormValues } from "../schemas/staff-ticket.schema";

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

  const ticketId = id ?? "";
  const { data: ticket, isLoading, isError } = useStaffTicketDetail(ticketId);
  const { data: activities = [], isLoading: activitiesLoading } =
    useStaffTicketActivities(ticketId);

  const startMutation = useStartTicket(ticketId);
  const holdMutation = useHoldTicket(ticketId);
  const resumeMutation = useResumeTicket(ticketId);
  const resolveMutation = useResolveTicket(ticketId);
  const escalateMutation = useEscalateTicket(ticketId);
  const commentMutation = useAddComment(ticketId);
  const logMutation = useAddMaintenanceLog(ticketId);

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
    commentMutation.mutate(data);
  };

  const handleLogSubmit = (data: MaintenanceLogFormValues) => {
    logMutation.mutate(data, { onSuccess: () => setLogOpen(false) });
  };

  const comments = ticket.comments ?? [];
  const logs = ticket.maintenanceLogs ?? [];

  const slaPct = ticket.slaTimer?.remainingPercent ?? 0;
  const slaBarCls =
    slaPct > 50
      ? "bg-emerald-500"
      : slaPct > 20
        ? "bg-amber-500"
        : "bg-red-500";

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
            <h1 className="text-base font-semibold truncate leading-tight mt-0.5">
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
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
              className="min-h-0 overflow-y-auto m-0 p-6 space-y-4"
            >
              {canComment && (
                <AddCommentForm
                  onSubmit={handleCommentSubmit}
                  isPending={commentMutation.isPending}
                />
              )}
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Chưa có bình luận nào.
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-xs font-medium">
                          {comment.authorDisplayName ?? comment.authorRole}
                        </p>
                        {comment.isInternal && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4 px-1.5"
                          >
                            Nội bộ
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground ml-auto">
                          {format(
                            new Date(comment.createdAt),
                            "dd/MM/yyyy HH:mm",
                            { locale: vi },
                          )}
                        </p>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {comment.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Maintenance logs */}
            <TabsContent
              value="logs"
              className="min-h-0 overflow-y-auto m-0 p-6 space-y-4"
            >
              {canAddLog && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogOpen(true)}
                >
                  + Thêm nhật ký
                </Button>
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
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{log.logType}</Badge>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.startedAt), "dd/MM/yyyy HH:mm", {
                            locale: vi,
                          })}
                        </p>
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
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* KB */}
            <TabsContent value="kb" className="min-h-0 overflow-y-auto m-0 p-6">
              <TicketKbReferencesPanel ticketId={ticketId} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Sidebar */}
        <div className="w-[300px] shrink-0 overflow-y-auto flex flex-col divide-y divide-border/60">
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
              <p className="text-xs text-muted-foreground">Chưa được triage.</p>
            )}
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
            <SideInfoRow label="Phạm vi" value={ticket.impactScope ?? null} />
            <SideInfoRow label="Khẩn cấp" value={ticket.urgencyLevel ?? null} />
            <SideInfoRow
              label="Ngày tạo"
              value={format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", {
                locale: vi,
              })}
            />
            {ticket.reopenCount > 0 && (
              <SideInfoRow label="Mở lại" value={`${ticket.reopenCount} lần`} />
            )}
          </div>
        </div>
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
    </div>
  );
}
