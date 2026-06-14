import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import TicketAttachments from "@/shared/components/common/TicketAttachments";
import {
  useManagerTicketDetail,
  useTicketActivities,
  useApproveTicket,
  useDeclareIncident,
} from "@/features/manager/hooks/useManagerTickets";
import {
  TicketStatusEnum,
  ActorRoleEnum,
  ImpactScopeEnum,
  UrgencyLevelEnum,
  TicketCategoryEnum,
} from "@/shared/types/ticket.types";
import TicketKbReferencesPanel from "@/features/manager/components/TicketKbReferencesPanel";

type DialogType =
  | "triage"
  | "assign"
  | "reassign"
  | "reject"
  | "escalate"
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

  const { data: ticket, isLoading, isError } = useManagerTicketDetail(id);
  const { data: activities = [], isLoading: activitiesLoading } =
    useTicketActivities(id);
  const { mutate: approve, isPending: approving } = useApproveTicket(id);
  const { mutate: declareIncident, isPending: declaring } =
    useDeclareIncident(id);

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
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
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
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/manager/tickets")}
          >
            ← Quay lại
          </Button>
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

      {/* ── Action buttons ── */}
      <div className="flex flex-wrap gap-2">
        {canTriage && (
          <Button onClick={() => setDialog("triage")}>Triage</Button>
        )}
        {canAssign && (
          <Button onClick={() => setDialog("assign")}>Gán Staff</Button>
        )}
        {canReassign && (
          <Button variant="outline" onClick={() => setDialog("reassign")}>
            Điều chuyển
          </Button>
        )}
        {canApprove && (
          <Button onClick={() => approve(undefined)} disabled={approving}>
            {approving ? "Đang xử lý..." : "Phê duyệt kết quả"}
          </Button>
        )}
        {canReject && (
          <Button variant="destructive" onClick={() => setDialog("reject")}>
            Từ chối
          </Button>
        )}
        {canEscalate && (
          <Button variant="outline" onClick={() => setDialog("escalate")}>
            Chuyển cấp
          </Button>
        )}
        {canDeclareIncident && (
          <Button
            variant="destructive"
            onClick={() => declareIncident()}
            disabled={declaring}
          >
            {declaring ? "Đang xử lý..." : "Khai báo Incident"}
          </Button>
        )}
      </div>

      <Separator />

      {/* ── Tabs ── */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="comments">
            Bình luận{comments.length > 0 && ` (${comments.length})`}
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="kb">Bài viết KB</TabsTrigger>
        </TabsList>

        {/* ── Tab: Thông tin ── */}
        <TabsContent value="info" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Danh mục</p>
              <p className="font-medium">
                {CATEGORY_LABEL[ticket.category] ?? ticket.category}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Nguồn</p>
              <p className="font-medium">{ticket.origin}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phạm vi ảnh hưởng</p>
              <p className="font-medium">
                {IMPACT_LABEL[ticket.impactScope] ?? ticket.impactScope}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Độ khẩn cấp</p>
              <p className="font-medium">
                {URGENCY_LABEL[ticket.urgencyLevel] ?? ticket.urgencyLevel}
              </p>
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
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>
          )}

          <TicketAttachments attachments={ticket.attachments} />

          {ticket.rejectionReason && (
            <Card className="border-destructive">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-destructive mb-1">
                  Lý do từ chối
                </p>
                <p className="text-sm">{ticket.rejectionReason}</p>
              </CardContent>
            </Card>
          )}

          {ticket.resolutionSummary && (
            <div>
              <p className="text-muted-foreground text-sm mb-1">
                Tóm tắt giải quyết
              </p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {ticket.resolutionSummary}
              </p>
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Bình luận ── */}
        <TabsContent value="comments" className="space-y-4 mt-4">
          <AddCommentForm ticketId={id} />
          <Separator />
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chưa có bình luận nào.
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {c.authorDisplayName ?? ROLE_LABEL[c.authorRole]}
                    </p>
                    {c.isInternal && (
                      <Badge variant="secondary" className="text-xs">
                        Nội bộ
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(c.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                  <Separator />
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Tab: Timeline ── */}
        <TabsContent value="timeline" className="mt-4">
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

        {/* ── Tab: Bài viết KB ── */}
        <TabsContent value="kb" className="mt-4">
          <TicketKbReferencesPanel ticketId={id} />
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}
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
