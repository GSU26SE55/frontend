import { Badge } from "@/components/ui/badge";
import {
  BlogPostStatusEnum,
  BlogPostStatusLabel,
  BlogPostOriginEnum,
  BlogPostOriginLabel,
} from "@/shared/enums/blog/blog.enum";
import { cn } from "@/lib/utils";
import {
  toneClass,
  BLOG_STATUS_TONE,
  BLOG_ORIGIN_TONE,
} from "@/shared/theme/statusColors";
import { Loader2 } from "lucide-react";

interface BlogStatusBadgeProps {
  status: BlogPostStatusEnum;
  className?: string;
}

export function BlogStatusBadge({ status, className }: BlogStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(toneClass(BLOG_STATUS_TONE[status] ?? "muted"), className)}
    >
      {status === BlogPostStatusEnum.Generating && (
        <Loader2 className="mr-1 size-3 animate-spin" />
      )}
      {BlogPostStatusLabel[status]}
    </Badge>
  );
}

interface BlogOriginBadgeProps {
  origin: BlogPostOriginEnum;
  className?: string;
}

export function BlogOriginBadge({ origin, className }: BlogOriginBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(toneClass(BLOG_ORIGIN_TONE[origin] ?? "muted"), className)}
    >
      {BlogPostOriginLabel[origin]}
    </Badge>
  );
}
