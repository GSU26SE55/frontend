import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const ALL_SITES = "Tất cả sites";

const GRANULARITY_LABEL: Record<ReportGranularityEnum, string> = {
  [ReportGranularityEnum.Day]: "Ngày",
  [ReportGranularityEnum.Week]: "Tuần",
  [ReportGranularityEnum.Month]: "Tháng",
};

// Filter bar chung: Site + Date range (from/to) + Granularity. Controlled qua props.
export function AnalyticsFilterBar({
  sites,
  filter,
  onChange,
}: AnalyticsFilterBarProps) {
  const invalidRange = !!filter.from && !!filter.to && filter.from > filter.to;

  return (
    <div className="flex flex-wrap items-end gap-3 bg-card rounded-lg border border-border p-3">
      <div className="flex flex-col gap-1">
        <Label className="text-[11px] text-muted-foreground">Site</Label>
        <Select
          value={filter.siteId ?? ALL_SITES}
          onValueChange={(v) =>
            onChange({
              ...filter,
              siteId: !v || v === ALL_SITES ? undefined : (v as string),
            })
          }
          items={[
            { value: ALL_SITES, label: "Toàn hệ thống" },
            ...sites.map((s) => ({ value: s.id, label: s.name })),
          ]}
        >
          <SelectTrigger className="w-52" size="sm">
            <SelectValue placeholder="Chọn site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SITES}>Toàn hệ thống</SelectItem>
            {sites.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-[11px] text-muted-foreground">Từ ngày</Label>
        <Input
          type="date"
          className="w-40"
          value={filter.from ?? ""}
          max={filter.to || undefined}
          onChange={(e) =>
            onChange({ ...filter, from: e.target.value || undefined })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-[11px] text-muted-foreground">Đến ngày</Label>
        <Input
          type="date"
          className="w-40"
          value={filter.to ?? ""}
          min={filter.from || undefined}
          onChange={(e) =>
            onChange({ ...filter, to: e.target.value || undefined })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-[11px] text-muted-foreground">Granularity</Label>
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
        <p className="text-[11px] text-destructive w-full">
          "Từ ngày" phải trước "Đến ngày".
        </p>
      )}
    </div>
  );
}
