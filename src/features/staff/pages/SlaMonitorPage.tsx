import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/shared/components/layout/PageContainer";
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
import { KpiCard } from "@/shared/components/dashboard/KpiCard";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";
import { useStaffTickets } from "@/features/staff/hooks/ticket/useStaffTickets";
import { useStaffTicketDashboardStats } from "@/shared/hooks/dashboard/useDashboardStats";
import TicketStatusBadge from "@/shared/components/ticket/TicketStatusBadge";
import TicketPriorityBadge from "@/shared/components/ticket/TicketPriorityBadge";
import { SlaCountdown } from "@/features/staff/components/ticket/SlaCountdown";
import { TABLE_COLUMNS } from "@/shared/constants/tableColumns";

export default function SlaMonitorPage() {
  const navigate = useNavigate();
  // E — filter + sort server-side (replaces client-side filtering on a 100-item capped page).
  const { data, isLoading, isError } = useStaffTickets({
    pageNumber: 1,
    pageSize: 100,
    slaOpen: true,
    sortBy: "slaRemaining",
  });
  // B — KPI counts the full total accurately (independent of the current page).
  const { data: staffStats, isLoading: statsLoading } =
    useStaffTicketDashboardStats();

  const monitoredTickets = data?.items ?? [];
  const monitoredCount = staffStats?.slaMonitoredCount ?? 0;
  const nearBreach = staffStats?.nearBreachCount ?? 0;
  const breachedCount = staffStats?.breachedCount ?? 0;
  const pausedCount = staffStats?.pausedCount ?? 0;

  return (
    <PageContainer>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Staff &middot; SLA
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">SLA Monitor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track SLA for the tickets assigned to you.
          </p>
        </div>
        <RefreshButton
          queryKeys={[KEY.staffTickets, KEY.staffTicketDashboard]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Monitoring"
          value={statsLoading ? "--" : monitoredCount}
          sub="tickets"
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          label="Near breach"
          value={statsLoading ? "--" : nearBreach}
          sub="<= 25%"
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-300"
        />
        <KpiCard
          label="Breached"
          value={statsLoading ? "--" : breachedCount}
          sub="tickets"
          icon={<AlertTriangle className="size-4" />}
          iconBg="bg-destructive/10"
          iconColor="text-destructive"
        />
        <KpiCard
          label="Paused"
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
              Showing {monitoredTickets.length}/{monitoredCount} tickets —
              closest to breach first.
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
            Couldn't load SLA data.
          </CardContent>
        ) : monitoredTickets.length === 0 ? (
          <CardContent className="py-10 text-center text-muted-foreground">
            No tickets currently running an SLA.
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  {TABLE_COLUMNS.index}
                </TableHead>
                <TableHead>{TABLE_COLUMNS.ticket}</TableHead>
                <TableHead>{TABLE_COLUMNS.status}</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>{TABLE_COLUMNS.sla}</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Details</TableHead>
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
                      Open
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
        <span>Ticket is past its SLA deadline.</span>
        <Badge variant="outline">Warning</Badge>
        <span>Ticket has at most 25% of its SLA time left.</span>
      </div>
    </PageContainer>
  );
}
