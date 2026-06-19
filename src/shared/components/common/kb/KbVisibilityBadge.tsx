import { Lock, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KbVisibilityBadgeProps {
  isInternalOnly: boolean;
  compact?: boolean;
  className?: string;
}

export function KbVisibilityBadge({
  isInternalOnly,
  compact,
  className,
}: KbVisibilityBadgeProps) {
  if (isInternalOnly) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 border-slate-600/40 bg-slate-700/10 text-slate-700 dark:text-slate-300",
          className,
        )}
      >
        <Lock size={12} />
        {!compact && "Nội bộ"}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
        className,
      )}
    >
      <Globe size={12} />
      {!compact && "Công khai"}
    </Badge>
  );
}
