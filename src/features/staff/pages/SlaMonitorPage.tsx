import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, Clock, TimerReset } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/shared/components/common/KpiCard";
import { useStaffTickets } from "@/features/staff/hooks/useStaffTickets";
import { useStaffTicketDashboardStats } from "@/shared/hooks/useDashboardStats";
import TicketStatusBadge from "@/shared/components/common/TicketStatusBadge";
import TicketPriorityBadge from "@/shared/components/common/TicketPriorityBadge";
import { SlaCountdown } from "@/features/staff/components/SlaCountdown";

export default function SlaMonitorPage() {
  const navigate = useNavigate();
  // E — filter + sort server-side (thay lọc client trên 1 trang cap 100).
  const { data, isLoading, isError, refetch, isFetching } = useStaffTickets({
    pageNumber: 1,
    pageSize: 100,
    slaOpen: true,
    sortBy: "slaRemaining",
  });
  // B — KPI đếm chính xác toàn bộ (không phụ thuộc trang).
  const { data: staffStats, isLoading: statsLoading } =
    useStaffTicketDashboardStats();

  const monitoredTickets = data?.items ?? [];
  const monitoredCount = staffStats?.slaMonitoredCount ?? 0;
  const nearBreach = staffStats?.nearBreachCount ?? 0;
  const breachedCount = staffStats?.breachedCount ?? 0;
  const pausedCount = staffStats?.pausedCount ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Staff &middot; SLA
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">SLA Monitor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi SLA của các ticket đang được giao cho bạn.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <TimerReset
            className={isFetching ? "size-3.5 animate-spin" : "size-3.5"}
          />
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Đang theo dõi"
          value={statsLoading ? "--" : monitoredCount}
          sub="tickets"
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          label="Sắp breach"
          value={statsLoading ? "--" : nearBreach}
          sub="<= 25%"
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-300"
        />
        <KpiCard
          label="Đã breach"
          value={statsLoading ? "--" : breachedCount}
          sub="tickets"
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-destructive/10"
          iconColor="text-destructive"
        />
        <KpiCard
          label="Tạm dừng"
          value={statsLoading ? "--" : pausedCount}
          sub="tickets"
          icon={<CheckCircle className="size-4" />}
          iconBg="bg-muted"
          iconColor="text-muted-foreground"
        />
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border py-4">
          <CardTitle>Ticket SLA</CardTitle>
          {monitoredCount > monitoredTickets.length && (
            <p className="text-xs text-muted-foreground">
              Hiển thị {monitoredTickets.length}/{monitoredCount} ticket — gần
              breach nhất trước.
            </p>
          )}
        </CardHeader>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <CardContent className="py-10 text-center text-destructive">
            Không thể tải dữ liệu SLA.
          </CardContent>
        ) : monitoredTickets.length === 0 ? (
          <CardContent className="py-10 text-center text-muted-foreground">
            Không có ticket nào đang chạy SLA.
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">STT</TableHead>
                <TableHead>Ticket</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ưu tiên</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Hạn xử lý</TableHead>
                <TableHead className="text-right">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitoredTickets.map((ticket, index) => (
                <TableRow key={ticket.id}>
                  <TableCell className="text-center text-muted-foreground tabular-nums">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {ticket.code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TicketStatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell>
                    <TicketPriorityBadge priority={ticket.priority} />
                  </TableCell>
                  <TableCell className="min-w-40">
                    <SlaCountdown slaTimer={ticket.slaTimer} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {ticket.slaTimer
                      ? new Date(ticket.slaTimer.dueAt).toLocaleString("vi-VN")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/staff/tickets/${ticket.id}`)}
                    >
                      Mở
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="destructive">Breached</Badge>
        <span>Ticket quá hạn SLA.</span>
        <Badge variant="outline">Warning</Badge>
        <span>Ticket còn tối đa 25% thời gian SLA.</span>
      </div>
    </div>
  );
}
