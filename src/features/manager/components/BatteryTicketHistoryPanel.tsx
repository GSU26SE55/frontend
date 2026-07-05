import { Link } from "react-router-dom";
import { format } from "date-fns";
import { History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TicketStatusBadge from "@/features/manager/components/TicketStatusBadge";
import { useAdminTicketList } from "@/features/manager/hooks/useManagerTickets";

interface Props {
  batteryAssetId?: string | null;
  currentTicketId: string;
}

/** Lịch sử ticket khác đã tạo trên cùng thiết bị pin — tối đa 5 ticket gần nhất. */
export default function BatteryTicketHistoryPanel({
  batteryAssetId,
  currentTicketId,
}: Props) {
  const { data, isLoading } = useAdminTicketList(
    batteryAssetId
      ? { batteryAssetId, pageSize: 6, isDescending: true }
      : undefined,
  );
  const tickets = (data?.items ?? []).filter((t) => t.id !== currentTicketId);

  if (!batteryAssetId) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <History className="size-4 text-muted-foreground" />
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Lịch sử ticket trên thiết bị này
        </p>
      </div>
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Chưa có ticket nào khác trên thiết bị này.
        </p>
      ) : (
        <div className="space-y-1.5">
          {tickets.slice(0, 5).map((t) => (
            <Link
              key={t.id}
              to={`/manager/tickets/${t.id}`}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-muted-foreground">
                    {t.code}
                  </span>
                  <TicketStatusBadge status={t.status} />
                </div>
                <p className="truncate mt-0.5">{t.title}</p>
              </div>
              <span className="shrink-0 text-muted-foreground">
                {format(new Date(t.createdAt), "dd/MM/yyyy")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
