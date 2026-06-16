import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  useDeclareIncident,
} from "../hooks/useAdminTickets";
import TicketStatusBadge from "../components/TicketStatusBadge";
import TicketPriorityBadge from "../components/TicketPriorityBadge";
import TicketActivityTimeline from "../components/TicketActivityTimeline";
import TicketAttachments from "@/shared/components/common/TicketAttachments";

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [incidentDescription, setIncidentDescription] = useState("");

  const { data: ticket, isLoading: loadingDetail } = useAdminTicketDetail(id!);
  const { data: activities, isLoading: loadingActivities } =
    useAdminTicketActivities(id!);
  const { mutate: declareIncident, isPending } = useDeclareIncident();

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
            <h1 className="text-base font-semibold truncate leading-tight mt-0.5">
              {ticket.title}
            </h1>
          </div>
        </div>

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

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Timeline (full height) */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          <div className="px-6 py-2.5 border-b border-border shrink-0">
            <span className="text-sm font-medium">Lịch sử hoạt động</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {loadingActivities ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <TicketActivityTimeline activities={activities} />
            )}
          </div>
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
              label="Ngày tạo"
              value={format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", {
                locale: vi,
              })}
            />
            {ticket.updatedAt && (
              <SideInfoRow
                label="Cập nhật"
                value={format(new Date(ticket.updatedAt), "dd/MM/yyyy HH:mm", {
                  locale: vi,
                })}
              />
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}
