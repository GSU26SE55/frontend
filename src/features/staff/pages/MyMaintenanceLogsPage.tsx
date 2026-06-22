import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshButton } from "@/shared/components/common/RefreshButton";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { useStaffMaintenanceLogs } from "@/features/staff/hooks/useStaffMaintenanceLogs";

export default function MyMaintenanceLogsPage() {
  const navigate = useNavigate();
  const { data: groups = [], isLoading, isError } = useStaffMaintenanceLogs();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Lịch sử bảo trì của tôi</h1>
          <p className="text-sm text-muted-foreground">
            Toàn bộ nhật ký bảo trì bạn đã ghi, gom theo ticket.
          </p>
        </div>
        <RefreshButton
          queryKeys={[QUERY_KEY.staffTickets.myMaintenanceLogs()]}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive py-8 text-center">
          Không tải được lịch sử bảo trì.
        </p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Bạn chưa ghi nhật ký bảo trì nào.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.ticketId}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <div className="min-w-0">
                  <CardTitle className="text-sm truncate">
                    {group.ticketTitle}
                  </CardTitle>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {group.ticketCode}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/staff/tickets/${group.ticketId}`)}
                >
                  Xem ticket
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.logs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-border rounded-lg p-3 space-y-1 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{log.logType}</Badge>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.startedAt), "dd/MM/yyyy HH:mm", {
                          locale: vi,
                        })}
                      </p>
                    </div>
                    {log.summary && (
                      <p className="font-medium">{log.summary}</p>
                    )}
                    {log.durationMinutes > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Thời lượng: {log.durationMinutes} phút
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
