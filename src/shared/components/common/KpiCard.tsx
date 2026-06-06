import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiTrend {
  dir: "up" | "down" | "flat";
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
            {trend.dir === "up" ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700 font-medium">
                <TrendingUp className="size-3" />
                {trend.value}
              </span>
            ) : trend.dir === "down" ? (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-red-700 font-medium">
                <TrendingDown className="size-3" />
                {trend.value}
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground font-medium">
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
