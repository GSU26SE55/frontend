import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
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

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/tickets")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{ticket.code}</h1>
              {ticket.isIncident && (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {ticket.title}
            </p>
          </div>
        </div>

        <Button
          variant="destructive"
          disabled={ticket.isIncident || isPending}
          onClick={() => setConfirmOpen(true)}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          {ticket.isIncident ? "Đã là Incident" : "Declare Incident"}
        </Button>
      </div>

      {/* Confirm Dialog */}
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
            <AlertDialogCancel onClick={() => setConfirmOpen(false)} />
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin ticket</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Trạng thái</p>
                <div className="mt-1">
                  <TicketStatusBadge status={ticket.status} />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Priority</p>
                <div className="mt-1">
                  <TicketPriorityBadge priority={ticket.priority} />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Phân loại</p>
                <p className="mt-1 font-medium">
                  {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Nguồn tạo</p>
                <p className="mt-1 font-medium">{ticket.origin}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ngày tạo</p>
                <p className="mt-1 font-medium">
                  {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              {ticket.updatedAt && (
                <div>
                  <p className="text-muted-foreground">Cập nhật lần cuối</p>
                  <p className="mt-1 font-medium">
                    {format(new Date(ticket.updatedAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {ticket.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mô tả</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </CardContent>
            </Card>
          )}

          {ticket.attachmentFileIds && ticket.attachmentFileIds.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <TicketAttachments fileIds={ticket.attachmentFileIds} />
              </CardContent>
            </Card>
          )}

          {ticket.rejectionReason && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-base text-destructive">
                  Lý do từ chối
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{ticket.rejectionReason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* SLA sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SLA Timer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {ticket.slaTimer ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trạng thái</span>
                    <span className="font-medium">
                      {ticket.slaTimer.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-medium">
                      {format(new Date(ticket.slaTimer.dueAt), "dd/MM HH:mm")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Còn lại</span>
                    <span className="font-medium">
                      {ticket.slaTimer.remainingPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ticket.slaTimer.remainingPercent > 50
                          ? "bg-green-500"
                          : ticket.slaTimer.remainingPercent > 20
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.max(0, ticket.slaTimer.remainingPercent)}%`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Chưa có SLA timer (ticket chưa được triage).
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketActivityTimeline
            activities={activities}
            isLoading={loadingActivities}
          />
        </CardContent>
      </Card>
    </div>
  );
}
