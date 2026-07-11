import { Lock, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toneClass } from "@/shared/theme/statusColors";

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
        className={cn("gap-1", toneClass("muted"), className)}
      >
        <Lock size={12} />
        {!compact && "Nội bộ"}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn("gap-1", toneClass("ok"), className)}
    >
      <Globe size={12} />
      {!compact && "Công khai"}
    </Badge>
  );
}
