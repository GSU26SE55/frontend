import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CalibrationsExpiringTable from "@/shared/components/iot/CalibrationsExpiringTable";
import { useExpiringCalibrations } from "@/shared/hooks/iot/useIotCalibrations";
import { useUrlFilters } from "@/shared/hooks/useUrlFilters";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";

const WITHIN_OPTIONS = [7, 30, 60, 90, 180];
const DEFAULTS = { within: 30 };

export default function CalibrationsExpiringPage() {
  const { filters, setFilter } = useUrlFilters(DEFAULTS);
  const { data, isLoading } = useExpiringCalibrations(filters.within);
  const items = data ?? [];

  return (
    <div className="p-6 space-y-6 max-w-360 mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Manager &middot; IoT
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Calibrations expiring soon
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "..." : items.length} calibrations need recalibrating.
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.iotCalibrations]} />
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">Within</Label>
        <Select
          value={String(filters.within)}
          onValueChange={(v) => setFilter("within", Number(v))}
          items={WITHIN_OPTIONS.map((d) => ({
            value: String(d),
            label: `${d} days`,
          }))}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {WITHIN_OPTIONS.map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d} days
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <CalibrationsExpiringTable items={items} />
        )}
      </Card>
    </div>
  );
}
