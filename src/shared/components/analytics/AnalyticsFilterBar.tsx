import { Label } from "@/components/ui/label";
import { DatePicker } from "@/shared/components/ui/DatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportGranularityEnum } from "@/shared/enums/dashboard/report.enum";
import type { AnalyticsFilter } from "@/shared/types/dashboard/analytics.types";

export interface SiteOption {
  id: string;
  name: string;
}

interface AnalyticsFilterBarProps {
  sites: SiteOption[];
  filter: AnalyticsFilter;
  onChange: (next: AnalyticsFilter) => void;
}

const ALL_SITES = "All sites";

const GRANULARITY_LABEL: Record<ReportGranularityEnum, string> = {
  [ReportGranularityEnum.Day]: "Day",
  [ReportGranularityEnum.Week]: "Week",
  [ReportGranularityEnum.Month]: "Month",
};

// Shared filter bar: Site + Date range (from/to) + Granularity. Controlled via props.
export function AnalyticsFilterBar({
  sites,
  filter,
  onChange,
}: AnalyticsFilterBarProps) {
  const invalidRange = !!filter.from && !!filter.to && filter.from > filter.to;

  return (
    <div className="flex flex-wrap items-end gap-3 bg-card rounded-lg border border-border p-3">
      <div className="flex flex-col gap-1">
        <Label className="text-2xs text-muted-foreground">Site</Label>
        <Select
          value={filter.siteId ?? ALL_SITES}
          onValueChange={(v) =>
            onChange({
              ...filter,
              siteId: !v || v === ALL_SITES ? undefined : (v as string),
            })
          }
          items={[
            { value: ALL_SITES, label: "All sites" },
            ...sites.map((s) => ({ value: s.id, label: s.name })),
          ]}
        >
          <SelectTrigger className="w-52" size="sm">
            <SelectValue placeholder="Select a site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SITES}>All sites</SelectItem>
            {sites.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-2xs text-muted-foreground">From date</Label>
        <DatePicker
          className="w-40"
          value={filter.from}
          max={filter.to}
          onChange={(v) => onChange({ ...filter, from: v })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-2xs text-muted-foreground">To date</Label>
        <DatePicker
          className="w-40"
          value={filter.to}
          min={filter.from}
          onChange={(v) => onChange({ ...filter, to: v })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-2xs text-muted-foreground">Granularity</Label>
        <Select
          value={filter.granularity ?? ReportGranularityEnum.Day}
          onValueChange={(v) =>
            onChange({
              ...filter,
              granularity:
                (v as ReportGranularityEnum) ?? ReportGranularityEnum.Day,
            })
          }
          items={Object.values(ReportGranularityEnum).map((g) => ({
            value: g,
            label: GRANULARITY_LABEL[g],
          }))}
        >
          <SelectTrigger className="w-32" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(ReportGranularityEnum).map((g) => (
              <SelectItem key={g} value={g}>
                {GRANULARITY_LABEL[g]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {invalidRange && (
        <p className="text-2xs text-destructive w-full">
          "From date" must be before "To date".
        </p>
      )}
    </div>
  );
}
