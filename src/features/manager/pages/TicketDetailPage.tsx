import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import TicketStatusBadge from "@/features/manager/components/TicketStatusBadge";
import TicketPriorityBadge from "@/features/manager/components/TicketPriorityBadge";
import SlaCountdown from "@/features/manager/components/SlaCountdown";
import TriageDialog from "@/features/manager/components/TriageDialog";
import AssignDialog from "@/features/manager/components/AssignDialog";
import ReassignDialog from "@/features/manager/components/ReassignDialog";
import RejectDialog from "@/features/manager/components/RejectDialog";
import EscalateDialog from "@/features/manager/components/EscalateDialog";
import DeclareIncidentDialog from "@/features/manager/components/DeclareIncidentDialog";
import TicketActivityTimeline from "@/features/manager/components/TicketActivityTimeline";
import AddCommentForm from "@/features/manager/components/AddCommentForm";
import TicketAttachments from "@/shared/components/common/TicketAttachments";
import {
  useManagerTicketDetail,
  useTicketActivities,
  useApproveTicket,
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

const ROLE_LABEL: Record<ActorRoleEnum, string> = {
  Admin: "Admin",
  Manager: "Manager",
  Staff: "Staff",
  Customer: "Khách hàng",
  System: "Hệ thống",
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

  const { data: ticket, isLoading, isError } = useManagerTicketDetail(id);
  const { data: activities = [], isLoading: activitiesLoading } =
    useTicketActivities(id);
  const { mutate: approve, isPending: approving } = useApproveTicket(id);

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
            <h1 className="text-base font-semibold truncate leading-tight mt-0.5">
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
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

            {/* Info — attachments only; description/resolution are in sidebar */}
            <TabsContent
              value="info"
              className="min-h-0 overflow-y-auto m-0 p-6"
            >
              {ticket.attachmentFileIds &&
              ticket.attachmentFileIds.length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Tệp đính kèm
                  </p>
                  <TicketAttachments fileIds={ticket.attachmentFileIds} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">
                  Không có tệp đính kèm.
                </p>
              )}
            </TabsContent>

            {/* Comments */}
            <TabsContent
              value="comments"
              className="min-h-0 overflow-y-auto m-0 p-6 space-y-4"
            >
              <AddCommentForm ticketId={id} />
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Chưa có bình luận nào.
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-xs font-medium">
                          {c.authorDisplayName ?? ROLE_LABEL[c.authorRole]}
                        </p>
                        {c.isInternal && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4 px-1.5"
                          >
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
                    </div>
                  ))}
                </div>
              )}
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
            <TabsContent
              value="kb"
              className="min-h-0 overflow-y-auto m-0 p-6"
            >
              <TicketKbReferencesPanel ticketId={id} />
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
              <p className="text-xs text-muted-foreground">
                Chưa được triage.
              </p>
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

          {/* Rejection reason */}
          {ticket.rejectionReason && (
            <div className="p-4">
              <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider mb-2">
                Lý do từ chối
              </p>
              <p className="text-xs leading-relaxed">{ticket.rejectionReason}</p>
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
                  ? (URGENCY_LABEL[ticket.urgencyLevel] ?? ticket.urgencyLevel)
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
                  { locale: vi },
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
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
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
