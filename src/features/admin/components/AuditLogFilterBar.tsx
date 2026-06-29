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

const ALL = "Tất cả hành động";

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
  actionOptions: string[]; // closed-set (enum) — dropdown, KHÔNG free-text (BE exact-match case-sensitive)
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
  // YYYY-MM-DD so sánh chuỗi đúng thứ tự thời gian.
  const dateError =
    !!values.dateFrom && !!values.dateTo && values.dateFrom > values.dateTo;

  return (
    <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:flex-wrap lg:items-end">
      <div className="space-y-1">
        <Label className="text-xs">Hành động</Label>
        <Select
          value={values.action ?? ALL}
          onValueChange={(v) =>
            onChange("action", v && v !== ALL ? v : undefined)
          }
        >
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue placeholder="Tất cả hành động" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả hành động</SelectItem>
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
        <Label className="text-xs">Từ ngày</Label>
        <Input
          type="date"
          value={values.dateFrom ?? ""}
          onChange={(e) => onChange("dateFrom", e.target.value || undefined)}
          className="w-full lg:w-40"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Đến ngày</Label>
        <Input
          type="date"
          value={values.dateTo ?? ""}
          onChange={(e) => onChange("dateTo", e.target.value || undefined)}
          className="w-full lg:w-40"
        />
      </div>

      {hasActive && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Xóa bộ lọc
        </Button>
      )}

      {dateError && (
        <p className="w-full text-sm text-destructive">
          "Từ ngày" phải ≤ "Đến ngày".
        </p>
      )}
    </div>
  );
}
