import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import TicketAttachments from "@/shared/components/common/TicketAttachments";
import { MaintenanceLogDialog } from "../components/MaintenanceLogDialog";
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
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
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

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/staff/tickets")}
            >
              ← Quay lại
            </Button>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {ticket.code}
          </p>
          <h1 className="text-2xl font-semibold leading-tight">
            {ticket.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            {ticket.isIncident && <Badge variant="destructive">Sự cố</Badge>}
          </div>
        </div>
        <div className="shrink-0 w-48">
          <SlaCountdown slaTimer={ticket.slaTimer} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {isAssigned && (
          <Button
            onClick={() => startMutation.mutate(undefined)}
            disabled={startMutation.isPending}
          >
            {startMutation.isPending ? "Đang xử lý..." : "Bắt đầu xử lý"}
          </Button>
        )}
        {isInProgress && (
          <>
            <Button variant="outline" onClick={() => setHoldOpen(true)}>
              Tạm dừng
            </Button>
            <Button variant="outline" onClick={() => setResolveOpen(true)}>
              Báo hoàn thành
            </Button>
            <Button variant="outline" onClick={() => setEscalateOpen(true)}>
              Yêu cầu chuyển cấp
            </Button>
          </>
        )}
        {isWaiting && (
          <Button
            onClick={() => resumeMutation.mutate(undefined)}
            disabled={resumeMutation.isPending}
          >
            {resumeMutation.isPending ? "Đang xử lý..." : "Tiếp tục xử lý"}
          </Button>
        )}
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="comments">Bình luận</TabsTrigger>
          <TabsTrigger value="logs">Nhật ký bảo trì</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Danh mục</p>
              <p className="font-medium">{ticket.category}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Nguồn</p>
              <p className="font-medium">{ticket.origin}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phạm vi ảnh hưởng</p>
              <p className="font-medium">{ticket.impactScope ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Độ khẩn cấp</p>
              <p className="font-medium">{ticket.urgencyLevel ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ngày tạo</p>
              <p className="font-medium">
                {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", {
                  locale: vi,
                })}
              </p>
            </div>
            {ticket.reopenCount > 0 && (
              <div>
                <p className="text-muted-foreground">Số lần mở lại</p>
                <p className="font-medium">{ticket.reopenCount}</p>
              </div>
            )}
          </div>
          {ticket.description && (
            <div>
              <p className="text-muted-foreground text-sm mb-1">Mô tả</p>
              <p className="text-sm whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          )}
          <TicketAttachments fileIds={ticket.attachmentFileIds} />
          {ticket.resolutionSummary && (
            <div>
              <p className="text-muted-foreground text-sm mb-1">
                Tóm tắt giải quyết
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {ticket.resolutionSummary}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
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

        <TabsContent value="comments" className="space-y-4 mt-4">
          {canComment && (
            <AddCommentForm
              onSubmit={handleCommentSubmit}
              isPending={commentMutation.isPending}
            />
          )}
          <Separator />
          <div className="space-y-4">
            {(ticket.comments ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chưa có bình luận nào.
              </p>
            ) : (
              (ticket.comments ?? []).map((comment) => (
                <div key={comment.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {comment.authorDisplayName ?? comment.authorRole}
                    </p>
                    {comment.isInternal && (
                      <Badge variant="secondary" className="text-xs">
                        Nội bộ
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(comment.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                  <Separator />
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 mt-4">
          {canAddLog && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogOpen(true)}
            >
              + Thêm nhật ký
            </Button>
          )}
          <div className="space-y-4">
            {(ticket.maintenanceLogs ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chưa có nhật ký bảo trì.
              </p>
            ) : (
              (ticket.maintenanceLogs ?? []).map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 space-y-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{log.logType}</Badge>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.startedAt), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </p>
                  </div>
                  {log.summary && <p className="font-medium">{log.summary}</p>}
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
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
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
