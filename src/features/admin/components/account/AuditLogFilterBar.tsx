import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/shared/components/ui/DatePicker";

const ALL = "All actions";

export interface AuditLogFilterValues {
  action?: string;
  target?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
}

interface AuditLogFilterBarProps {
  values: AuditLogFilterValues;
  onChange: <K extends keyof AuditLogFilterValues>(
    key: K,
    value: AuditLogFilterValues[K],
  ) => void;
  onReset: () => void;
  actionOptions: string[]; // closed-set (enum) — dropdown, NOT free-text (BE exact-match case-sensitive)
  targetLabel: string; // "Battery ID" | "Alert ID"
}

export default function AuditLogFilterBar({
  values,
  onChange,
  onReset,
  actionOptions,
  targetLabel,
}: AuditLogFilterBarProps) {
  const hasActive =
    !!values.action || !!values.target || !!values.dateFrom || !!values.dateTo;
  // YYYY-MM-DD string comparison sorts in chronological order.
  const dateError =
    !!values.dateFrom && !!values.dateTo && values.dateFrom > values.dateTo;

  return (
    <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:flex-wrap lg:items-end">
      <div className="space-y-1">
        <Label className="text-xs">Action</Label>
        <Select
          value={values.action ?? ALL}
          onValueChange={(v) =>
            onChange("action", v && v !== ALL ? v : undefined)
          }
          items={[
            { value: ALL, label: ALL },
            ...actionOptions.map((a) => ({ value: a, label: a })),
          ]}
        >
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{ALL}</SelectItem>
            {actionOptions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{targetLabel}</Label>
        <Input
          value={values.target ?? ""}
          onChange={(e) => onChange("target", e.target.value || undefined)}
          placeholder="UUID"
          className="w-full lg:w-64"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">From date</Label>
        <DatePicker
          value={values.dateFrom}
          onChange={(v) => onChange("dateFrom", v)}
          max={values.dateTo}
          className="w-full lg:w-40"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">To date</Label>
        <DatePicker
          value={values.dateTo}
          onChange={(v) => onChange("dateTo", v)}
          min={values.dateFrom}
          className="w-full lg:w-40"
        />
      </div>

      {hasActive && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Clear filters
        </Button>
      )}

      {dateError && (
        <p className="w-full text-sm text-destructive">
          "From date" must be ≤ "To date".
        </p>
      )}
    </div>
  );
}
