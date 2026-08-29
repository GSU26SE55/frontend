import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  notificationTypeLabel,
  notificationChannelLabel,
  notificationBatchSourceLabel,
  notificationBatchStatusLabel,
} from "@/shared/constants/notificationLabels";
import { useNotificationBatchDetail } from "@/features/admin/hooks/notification/useNotificationGroups";
import { NotificationBatchTargetKindEnum } from "@/features/admin/types/notification/notification-group.types";

interface Props {
  batchId: string;
  onOpenChange: (open: boolean) => void;
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "bad";
}) {
  const color =
    tone === "ok"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "bad"
          ? "text-red-500"
          : "";
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <p className="text-2xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

export default function NotificationBatchDetailDialog({
  batchId,
  onOpenChange,
}: Props) {
  const { data, isLoading } = useNotificationBatchDetail(batchId);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send details</DialogTitle>
          <DialogDescription>
            Stats refresh every 15 seconds while this window stays open — the
            worker delivers gradually, so the numbers keep changing.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">{data.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-base text-muted-foreground">
                {data.body}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-3xs">
                  {notificationTypeLabel(data.type)}
                </Badge>
                {data.channels.map((c) => (
                  <Badge key={c} variant="outline" className="text-3xs">
                    {notificationChannelLabel(c)}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-3xs">
                  {notificationBatchSourceLabel(data.source)}
                </Badge>
                <Badge variant="outline" className="text-3xs">
                  {notificationBatchStatusLabel(data.status)}
                </Badge>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium">Sent to</p>
              <div className="flex flex-wrap gap-1">
                {data.targets.map((t, i) => (
                  <Badge key={i} variant="secondary" className="text-3xs">
                    {t.targetKind === NotificationBatchTargetKindEnum.Group
                      ? // Deleted groups still show WITH THEIR NAME — the backend deliberately
                        // does not filter out soft-deleted rows. The fallback branch is only
                        // reached if the group row was HARD-deleted from the DB.
                        (t.groupName ?? "Group no longer exists")
                      : "Selected individuals"}
                  </Badge>
                ))}
                {data.targets.length === 0 && (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Stat label="Recipients" value={data.distinctRecipients} />
              <Stat label="Total rows" value={data.totalRows} />
              <Stat label="Queued" value={data.pendingCount} />
              <Stat label="Delivered" value={data.sentCount} tone="ok" />
              <Stat label="Read" value={data.readCount} tone="ok" />
              <Stat label="Failed" value={data.failedCount} tone="bad" />
            </div>

            {data.failedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Failed rows are usually caused by the recipient turning that
                channel off in their preferences, or by a missing email / phone
                number / push-registered device.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
