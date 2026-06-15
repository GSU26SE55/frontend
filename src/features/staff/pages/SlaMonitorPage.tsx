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
import {
  SlaTimerStatusEnum,
  TicketStatusEnum,
} from "@/shared/types/ticket.types";
import { useStaffTickets } from "@/features/staff/hooks/useStaffTickets";
import { TicketStatusBadge } from "@/features/staff/components/TicketStatusBadge";
import { TicketPriorityBadge } from "@/features/staff/components/TicketPriorityBadge";
import { SlaCountdown } from "@/features/staff/components/SlaCountdown";
import type { TicketDTO } from "@/shared/types/ticket.types";

const OPEN_STATUSES = new Set<string>([
  TicketStatusEnum.Assigned,
  TicketStatusEnum.InProgress,
  TicketStatusEnum.WaitingCustomer,
  TicketStatusEnum.WaitingParts,
  TicketStatusEnum.WaitingOnsiteSchedule,
  TicketStatusEnum.Escalated,
]);

function getSlaSortValue(ticket: TicketDTO) {
  if (!ticket.slaTimer) return 999;
  if (ticket.slaTimer.status === SlaTimerStatusEnum.Breached) return -1;
  return ticket.slaTimer.remainingPercent;
}

export default function SlaMonitorPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useStaffTickets({
    pageNumber: 1,
    pageSize: 100,
  });

  const tickets = data?.items ?? [];
  const monitoredTickets = tickets
    .filter((ticket) => OPEN_STATUSES.has(ticket.status) && ticket.slaTimer)
    .sort((a, b) => getSlaSortValue(a) - getSlaSortValue(b));
  const breached = monitoredTickets.filter(
    (ticket) => ticket.slaTimer?.status === SlaTimerStatusEnum.Breached,
  );
  const paused = monitoredTickets.filter(
    (ticket) => ticket.slaTimer?.status === SlaTimerStatusEnum.Paused,
  );
  const warning = monitoredTickets.filter((ticket) => {
    const percent = ticket.slaTimer?.remainingPercent;
    return percent !== undefined && percent > 0 && percent <= 25;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
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
          value={isLoading ? "--" : monitoredTickets.length}
          sub="tickets"
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          label="Sắp breach"
          value={isLoading ? "--" : warning.length}
          sub="<= 25%"
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-300"
        />
        <KpiCard
          label="Đã breach"
          value={isLoading ? "--" : breached.length}
          sub="tickets"
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-destructive/10"
          iconColor="text-destructive"
        />
        <KpiCard
          label="Tạm dừng"
          value={isLoading ? "--" : paused.length}
          sub="tickets"
          icon={<CheckCircle className="size-4" />}
          iconBg="bg-muted"
          iconColor="text-muted-foreground"
        />
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border py-4">
          <CardTitle>Ticket SLA</CardTitle>
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
                <TableHead>Ticket</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ưu tiên</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Hạn xử lý</TableHead>
                <TableHead className="text-right">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitoredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
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
