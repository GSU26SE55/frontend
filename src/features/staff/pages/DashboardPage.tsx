import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/shared/components/common/KpiCard";
import {
  SlaTimerStatusEnum,
  TicketStatusEnum,
} from "@/shared/types/ticket.types";
import { useStaffTickets } from "@/features/staff/hooks/useStaffTickets";
import { TicketCard } from "@/features/staff/components/TicketCard";
import type { TicketDTO } from "@/shared/types/ticket.types";

const OPEN_STATUSES = new Set<string>([
  TicketStatusEnum.Assigned,
  TicketStatusEnum.InProgress,
  TicketStatusEnum.WaitingCustomer,
  TicketStatusEnum.WaitingParts,
  TicketStatusEnum.WaitingOnsiteSchedule,
  TicketStatusEnum.Escalated,
]);

function isNearBreach(ticket: TicketDTO) {
  const percent = ticket.slaTimer?.remainingPercent;
  return percent !== undefined && percent > 0 && percent <= 25;
}

function isBreached(ticket: TicketDTO) {
  return ticket.slaTimer?.status === SlaTimerStatusEnum.Breached;
}

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useStaffTickets({
    pageNumber: 1,
    pageSize: 100,
  });

  const tickets = data?.items ?? [];
  const openTickets = tickets.filter((ticket) =>
    OPEN_STATUSES.has(ticket.status),
  );
  const nearBreach = openTickets.filter(isNearBreach);
  const breached = openTickets.filter(isBreached);
  const resolved = tickets.filter(
    (ticket) => ticket.status === TicketStatusEnum.Resolved,
  );
  const priorityTickets = [...openTickets].sort((a, b) => {
    const aPercent = a.slaTimer?.remainingPercent ?? 101;
    const bPercent = b.slaTimer?.remainingPercent ?? 101;
    return aPercent - bPercent;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1440px] mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Staff &middot; Dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bảng làm việc
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi ticket được giao và rủi ro SLA theo thời gian thực.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={isFetching ? "size-3.5 animate-spin" : "size-3.5"}
            />
            Làm mới
          </Button>
          <Button size="sm" onClick={() => navigate("/staff/tickets")}>
            <Ticket className="size-3.5" />
            My Tickets
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Đang phụ trách"
          value={isLoading ? "--" : openTickets.length}
          sub="tickets"
          icon={<FileText className="size-4" />}
        />
        <KpiCard
          label="Sắp breach SLA"
          value={isLoading ? "--" : nearBreach.length}
          sub="<= 25%"
          icon={<Clock className="size-4" />}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-300"
        />
        <KpiCard
          label="Đã quá hạn"
          value={isLoading ? "--" : breached.length}
          sub="tickets"
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-destructive/10"
          iconColor="text-destructive"
        />
        <KpiCard
          label="Đã xử lý"
          value={isLoading ? "--" : resolved.length}
          sub="tickets"
          icon={<CheckCircle className="size-4" />}
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
      </div>

      {isError && (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            Không thể tải dữ liệu Staff dashboard.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ưu tiên xử lý</CardTitle>
            <CardDescription>
              Ticket mở được sắp theo phần trăm SLA còn lại.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 rounded-md" />
                ))}
              </div>
            ) : priorityTickets.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle className="mx-auto size-8 text-primary" />
                <p className="mt-3 text-sm font-medium">
                  Không có ticket đang mở
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Các ticket được giao sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {priorityTickets.slice(0, 4).map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tổng quan trạng thái</CardTitle>
            <CardDescription>Từ danh sách ticket của tôi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Đã gán", TicketStatusEnum.Assigned],
              ["Đang xử lý", TicketStatusEnum.InProgress],
              ["Đang chờ", TicketStatusEnum.WaitingCustomer],
              ["Chờ linh kiện", TicketStatusEnum.WaitingParts],
              ["Đã chuyển cấp", TicketStatusEnum.Escalated],
            ].map(([label, status]) => {
              const count = tickets.filter(
                (ticket) => ticket.status === status,
              ).length;
              return (
                <div
                  key={status}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold tabular-nums">
                    {isLoading ? "--" : count}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
