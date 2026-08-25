import { useTicketHealth } from "@/features/admin/hooks/ticket/useTicketHealth";
import { toneFill, type StatusTone } from "@/shared/theme/statusColors";

function statusTone(status?: string): StatusTone {
  switch (status) {
    case "Healthy":
      return "ok";
    case "Warning":
      return "p3";
    case "Degraded":
      return "p1";
    default:
      return "muted";
  }
}

/**
 * One service reading: what it is, the number behind it, and the verdict as a pill.
 * The verdict carries the only colour, so a healthy row stays quiet.
 */
function HealthItem({
  label,
  status,
  detail,
  loading,
}: {
  label: string;
  status?: string;
  detail?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-l border-border px-4 py-2.5 first:border-l-0 first:pl-0">
      <div className="min-w-0">
        <p className="truncate text-sm">{label}</p>
        {detail && (
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        )}
      </div>
      <span
        className={`ml-auto shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${toneFill(
          statusTone(status),
        )}`}
      >
        {loading ? "…" : (status ?? "N/A")}
      </span>
    </div>
  );
}

/**
 * Ticket service health, read as one strip rather than a card of cards: on the dashboard
 * this is a footnote to the numbers above it, not a panel competing with them.
 */
export function TicketHealthCard() {
  const { health, syncLag, saga } = useTicketHealth();

  return (
    <div className="grid grid-cols-1 border-b border-border pb-1 sm:grid-cols-3">
      <HealthItem
        label="Ticket service"
        status={health.data?.status}
        loading={health.isLoading}
        detail={health.data?.service}
      />
      <HealthItem
        label="Sync lag"
        status={syncLag.data?.status}
        loading={syncLag.isLoading}
        detail={
          syncLag.data
            ? `max ${Math.round(syncLag.data.maxLagSeconds)}s`
            : undefined
        }
      />
      <HealthItem
        label="Saga"
        status={saga.data?.status}
        loading={saga.isLoading}
        detail={
          saga.data
            ? `${saga.data.failedLast24h} failed in 24h, ${saga.data.stuckOver15min} stuck`
            : undefined
        }
      />
    </div>
  );
}
