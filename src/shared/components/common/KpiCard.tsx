import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { TrendDir } from "@/shared/enums/common.enum";
import { toneFill } from "@/shared/theme/statusColors";

export interface KpiTrend {
  dir: TrendDir;
  value: string;
  note: string;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: KpiTrend;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}

export function KpiCard({
  label,
  value,
  sub,
  trend,
  icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tracking-tight">
                {value}
              </span>
              {sub && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {sub}
                </span>
              )}
            </div>
          </div>
          {icon && (
            <div
              className={cn(
                "flex items-center justify-center rounded-lg p-2",
                iconBg,
                iconColor,
              )}
            >
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {trend.dir === TrendDir.Up ? (
              <span
                className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium ${toneFill("ok")}`}
              >
                <TrendingUp className="size-3" />
                {trend.value}
              </span>
            ) : trend.dir === TrendDir.Down ? (
              <span
                className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium ${toneFill("p1")}`}
              >
                <TrendingDown className="size-3" />
                {trend.value}
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium ${toneFill("muted")}`}
              >
                <Minus className="size-3" />
                {trend.value}
              </span>
            )}
            <span className="text-muted-foreground">{trend.note}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
