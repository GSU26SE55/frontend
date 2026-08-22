import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { KbReferenceTypeLabel } from "@/shared/enums/kb/kb.enum";
import { useKbUsageStats } from "@/shared/hooks/kb/useKbUsageStats";

interface Props {
  articleId: string;
  open: boolean;
  onClose: () => void;
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function KbUsageStatsDialog({ articleId, open, onClose }: Props) {
  // Lazy: only fetch while the dialog is open (gated by passing an empty id when closed).
  const { data, isLoading, isError } = useKbUsageStats(open ? articleId : "");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Usage stats</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-destructive py-4 text-center">
            Couldn't load usage stats.
          </p>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between py-2 mb-2">
              <span className="text-sm font-medium">Total references</span>
              <span className="text-2xl font-bold tabular-nums">
                {data.totalReferences}
              </span>
            </div>
            <StatRow
              label={KbReferenceTypeLabel.ConsultedDuringResolve}
              value={data.byType.consultedDuringResolve}
            />
            <StatRow
              label={KbReferenceTypeLabel.ProvidedToCustomer}
              value={data.byType.providedToCustomer}
            />
            <StatRow
              label={KbReferenceTypeLabel.GeneratedAfterResolve}
              value={data.byType.generatedAfterResolve}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
