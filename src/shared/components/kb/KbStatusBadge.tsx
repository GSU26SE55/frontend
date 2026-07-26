import { Badge } from "@/components/ui/badge";
import {
  KbArticleStatusEnum,
  KbArticleStatusLabel,
} from "@/shared/enums/kb/kb.enum";
import { cn } from "@/lib/utils";
import { toneClass, KB_STATUS_TONE } from "@/shared/theme/statusColors";

interface KbStatusBadgeProps {
  status: KbArticleStatusEnum;
  className?: string;
}

export function KbStatusBadge({ status, className }: KbStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(toneClass(KB_STATUS_TONE[status] ?? "muted"), className)}
    >
      {KbArticleStatusLabel[status]}
    </Badge>
  );
}
