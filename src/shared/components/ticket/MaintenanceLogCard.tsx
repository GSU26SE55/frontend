import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Clock, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TicketAttachments from "@/shared/components/ticket/TicketAttachments";
import { MAINTENANCE_LOG_TYPE_LABEL } from "@/shared/constants/ticketLabels";
import { formatLogDuration } from "@/shared/utils/ticket.utils";
import type { MaintenanceLogDTO } from "@/shared/types/ticket/ticket.types";

/**
 * One labelled line of the report. Rendered only when it has content, so a log with just a
 * diagnosis does not leave two empty rows behind.
 *
 * A bare label above the text rather than a filled box: the cards sit in a grid now, and
 * three stacked boxes made even a two-word log tall enough to push its row out.
 */
function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        {label}
      </p>
      <p className="text-sm whitespace-pre-wrap wrap-break-word">{value}</p>
    </div>
  );
}

function PhotoGroup({
  label,
  fileIds,
}: {
  label: string;
  fileIds?: string[] | null;
}) {
  if (!fileIds?.length) return null;
  return <TicketAttachments fileIds={fileIds} label={label} compact />;
}

/**
 * A maintenance log rendered as a compact report card, sized to sit several-per-row in a
 * grid rather than as one full-width band per log.
 *
 * Lives in shared because Staff, Manager and Admin all read the same logs — Manager and
 * Admin pass no `onEdit`, since the BE only lets a log's own author edit it.
 *
 * The three narrative fields are the substance of the log — what was found, what was done,
 * how it ended — so each keeps its own labelled line instead of trailing off as muted
 * "Label: value" paragraphs. Everything that frames them (type, duration, when) sits in the
 * header, which keeps the body scannable once a ticket accumulates several logs.
 */
export default function MaintenanceLogCard({
  log,
  onEdit,
}: {
  log: MaintenanceLogDTO;
  /** Omit to hide the button — the caller decides whether this log is still editable. */
  onEdit?: () => void;
}) {
  const started = new Date(log.startedAt);
  const completed = log.completedAt ? new Date(log.completedAt) : null;

  // Same-day logs repeat the date twice otherwise ("08/25 14:55 → 08/25 23:19").
  const sameDay =
    completed && format(started, "yyyy-MM-dd") === format(completed, "yyyy-MM-dd");
  const when = completed
    ? `${format(started, "MM/dd/yyyy HH:mm", { locale: enUS })} → ${format(
        completed,
        sameDay ? "HH:mm" : "MM/dd/yyyy HH:mm",
        { locale: enUS },
      )}`
    : format(started, "MM/dd/yyyy HH:mm", { locale: enUS });

  const hasBody =
    !!log.diagnosisDetails?.trim() ||
    !!log.actionsTaken?.trim() ||
    !!log.resolutionNote?.trim();

  return (
    <div className="rounded-lg border border-border overflow-hidden h-full">
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
        <Badge variant="outline" className="bg-background">
          {MAINTENANCE_LOG_TYPE_LABEL[log.logType] ?? log.logType}
        </Badge>
        {log.durationMinutes > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Clock className="size-3" />
            {formatLogDuration(log.durationMinutes)}
          </span>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 px-2 text-xs"
            onClick={onEdit}
          >
            <Pencil className="size-3" />
            Edit
          </Button>
        )}
      </div>

      <div className="p-3 space-y-2.5">
        {/* Under the header, not beside it: at a third of the row the badges and the
            timestamp would fight for the same line and wrap. */}
        <p className="text-xs text-muted-foreground">
          {log.staffName?.trim() && (
            <>
              <span className="font-medium text-foreground">
                {log.staffName}
              </span>
              <span className="mx-1.5">·</span>
            </>
          )}
          <span className="tabular-nums">{when}</span>
        </p>

        {log.summary?.trim() && (
          <p className="font-medium wrap-break-word">{log.summary}</p>
        )}

        {hasBody && (
          <div className="space-y-2">
            <Field label="Diagnosis" value={log.diagnosisDetails} />
            <Field label="Actions taken" value={log.actionsTaken} />
            <Field label="Result" value={log.resolutionNote} />
          </div>
        )}

        <PhotoGroup label="Before" fileIds={log.beforePhotosFileIds} />
        <PhotoGroup label="After" fileIds={log.afterPhotosFileIds} />
        <PhotoGroup label="Attachments" fileIds={log.attachmentFileIds} />
      </div>
    </div>
  );
}
