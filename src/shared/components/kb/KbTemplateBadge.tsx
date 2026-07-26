import { LayoutTemplate } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toneClass } from "@/shared/theme/statusColors";

interface KbTemplateBadgeProps {
  isTemplate: boolean;
  compact?: boolean;
  className?: string;
}

/** Chỉ hiện khi bài là mẫu — bài thường không cần nhãn "không phải mẫu". */
export function KbTemplateBadge({
  isTemplate,
  compact,
  className,
}: KbTemplateBadgeProps) {
  if (!isTemplate) return null;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1", toneClass("info"), className)}
    >
      <LayoutTemplate size={12} />
      {!compact && "Bài mẫu"}
    </Badge>
  );
}
