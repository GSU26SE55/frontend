import { Activity } from "lucide-react";
import { useTicketHealth } from "@/features/admin/hooks/ticket/useTicketHealth";
import { toneFill } from "@/shared/theme/statusColors";

function statusTone(status?: string) {
  switch (status) {
    case "Healthy":
      return toneFill("ok");
    case "Warning":
      return toneFill("p3");
    case "Degraded":
      return toneFill("p1");
    default:
      return toneFill("muted");
  }
}

function HealthPill({
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
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs font-medium truncate">{label}</p>
        {detail && (
          <p className="text-[11px] text-muted-foreground truncate">{detail}</p>
        )}
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone(
          status,
        )}`}
      >
        {loading ? "…" : (status ?? "N/A")}
      </span>
    </div>
  );
}

export function TicketHealthCard() {
  const { health, syncLag, saga } = useTicketHealth();

  return (
    <div className="shrink-0 rounded-xl border border-border p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Activity className="size-3.5 text-muted-foreground" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Ticket Service Health
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <HealthPill
          label="Service"
          status={health.data?.status}
          loading={health.isLoading}
          detail={health.data?.service}
        />
        <HealthPill
          label="Sync lag"
          status={syncLag.data?.status}
          loading={syncLag.isLoading}
          detail={
            syncLag.data
              ? `max ${Math.round(syncLag.data.maxLagSeconds)}s`
              : undefined
          }
        />
        <HealthPill
          label="Saga"
          status={saga.data?.status}
          loading={saga.isLoading}
          detail={
            saga.data
              ? `${saga.data.failedLast24h} failed/24h · ${saga.data.stuckOver15min} stuck`
              : undefined
          }
        />
      </div>
    </div>
  );
}
