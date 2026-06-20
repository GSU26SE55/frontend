import { Badge } from "@/components/ui/badge";
import {
  KbArticleStatusEnum,
  KbArticleStatusLabel,
} from "@/shared/enums/kb.enum";

const variantMap: Record<
  KbArticleStatusEnum,
  "secondary" | "default" | "outline"
> = {
  [KbArticleStatusEnum.Draft]: "secondary",
  [KbArticleStatusEnum.PendingReview]: "outline",
  [KbArticleStatusEnum.Published]: "default",
  [KbArticleStatusEnum.Archived]: "outline",
};

interface KbStatusBadgeProps {
  status: KbArticleStatusEnum;
  className?: string;
}

export function KbStatusBadge({ status, className }: KbStatusBadgeProps) {
  return (
    <Badge variant={variantMap[status]} className={className}>
      {KbArticleStatusLabel[status]}
    </Badge>
  );
}
