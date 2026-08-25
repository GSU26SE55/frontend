import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { useStaffMaintenanceLogs } from "@/features/staff/hooks/ticket/useStaffMaintenanceLogs";

export default function MyMaintenanceLogsPage() {
  const navigate = useNavigate();
  const { data: groups = [], isLoading, isError } = useStaffMaintenanceLogs();

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">My maintenance history</h1>
          <p className="text-sm text-muted-foreground">
            All the maintenance logs you've recorded, grouped by ticket.
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
          Couldn't load maintenance history.
        </p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          You haven't recorded any maintenance logs yet.
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
                  View ticket
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
                        {format(new Date(log.startedAt), "MM/dd/yyyy HH:mm", {
                          locale: enUS,
                        })}
                      </p>
                    </div>
                    {log.summary && (
                      <p className="font-medium">{log.summary}</p>
                    )}
                    {log.durationMinutes > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Duration: {log.durationMinutes} min
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
