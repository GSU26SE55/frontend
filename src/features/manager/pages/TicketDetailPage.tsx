import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import TicketStatusBadge from "@/features/manager/components/TicketStatusBadge";
import TicketPriorityBadge from "@/features/manager/components/TicketPriorityBadge";
import SlaCountdown from "@/features/manager/components/SlaCountdown";
import TriageDialog from "@/features/manager/components/TriageDialog";
import AssignDialog from "@/features/manager/components/AssignDialog";
import ReassignDialog from "@/features/manager/components/ReassignDialog";
import RejectDialog from "@/features/manager/components/RejectDialog";
import EscalateDialog from "@/features/manager/components/EscalateDialog";
import TicketActivityTimeline from "@/features/manager/components/TicketActivityTimeline";
import AddCommentForm from "@/features/manager/components/AddCommentForm";
import {
  useManagerTicketDetail,
  useTicketActivities,
  useApproveTicket,
  useDeclareIncident,
} from "@/features/manager/hooks/useManagerTickets";
import { TicketStatusEnum, ActorRoleEnum } from "@/shared/types/ticket.types";

type DialogType =
  | "triage"
  | "assign"
  | "reassign"
  | "reject"
  | "escalate"
  | null;

const CATEGORY_LABEL: Record<string, string> = {
  Charging: "Sạc",
  Overheat: "Quá nhiệt",
  NoPower: "Không điện",
  Performance: "Hiệu suất",
  Repair: "Sửa chữa",
  Other: "Khác",
};

const ROLE_LABEL: Record<ActorRoleEnum, string> = {
  Admin: "Admin",
  Manager: "Manager",
  Staff: "Staff",
  Customer: "Khách hàng",
  System: "Hệ thống",
};

export default function TicketDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<DialogType>(null);

  const { data: ticket, isLoading } = useManagerTicketDetail(id);
  const { data: activities = [] } = useTicketActivities(id);
  const { mutate: approve, isPending: approving } = useApproveTicket(id);
  const { mutate: declareIncident, isPending: declaring } =
    useDeclareIncident(id);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Không tìm thấy ticket.</p>
        <Button variant="link" onClick={() => navigate("/manager/tickets")}>
          Quay lại
        </Button>
      </div>
    );
  }

  const status = ticket.status;
  const canTriage = status === TicketStatusEnum.Open;
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
  const canEscalate = !(
    [
      TicketStatusEnum.Closed,
      TicketStatusEnum.ClosedPendingRate,
    ] as TicketStatusEnum[]
  ).includes(status);
  const canDeclareIncident = !ticket.isIncident;

  const comments = ticket.comments ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate("/manager/tickets")}
            className="text-sm text-muted-foreground hover:underline mb-1 block"
          >
            ← Danh sách ticket
          </button>
          <h1 className="text-xl font-bold">{ticket.title}</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {ticket.code}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TicketStatusBadge status={ticket.status} />
          {ticket.isIncident && <Badge variant="destructive">INCIDENT</Badge>}
        </div>
      </div>

      {/* Info + SLA */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Priority</p>
          <TicketPriorityBadge priority={ticket.priority} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">SLA</p>
          <SlaCountdown slaTimer={ticket.slaTimer} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Loại</p>
          <p className="text-sm">
            {CATEGORY_LABEL[ticket.category] ?? ticket.category}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Nguồn</p>
          <p className="text-sm">{ticket.origin}</p>
        </div>
      </div>

      {ticket.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Mô tả</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          </CardContent>
        </Card>
      )}

      {ticket.rejectionReason && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-sm text-destructive">
              Lý do từ chối
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{ticket.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Thao tác</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
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
              size="sm"
              variant="outline"
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
              {approving ? "Đang xử lý..." : "Phê duyệt kết quả"}
            </Button>
          )}
          {canReject && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDialog("reject")}
            >
              Từ chối
            </Button>
          )}
          {canEscalate && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialog("escalate")}
            >
              Chuyển cấp
            </Button>
          )}
          {canDeclareIncident && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => declareIncident()}
              disabled={declaring}
            >
              {declaring ? "Đang xử lý..." : "Khai báo Incident"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bình luận</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có bình luận.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="rounded border p-3 text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {c.authorDisplayName ?? ROLE_LABEL[c.authorRole]}
                </span>
                {c.isInternal && (
                  <Badge variant="secondary" className="text-xs">
                    Nội bộ
                  </Badge>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
          <div className="pt-2 border-t">
            <AddCommentForm ticketId={id} />
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Lịch sử hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketActivityTimeline activities={activities} />
        </CardContent>
      </Card>

      {/* Dialogs */}
      {dialog === "triage" && (
        <TriageDialog ticketId={id} open onClose={() => setDialog(null)} />
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
    </div>
  );
}
