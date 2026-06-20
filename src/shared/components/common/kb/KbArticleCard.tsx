import { Card, CardContent } from "@/components/ui/card";
import { Eye, ThumbsUp } from "lucide-react";
import { KbStatusBadge } from "./KbStatusBadge";
import type { KbArticleSummaryDTO } from "@/shared/types/kb.types";

interface KbArticleCardProps {
  article: KbArticleSummaryDTO;
  onClick?: () => void;
  actions?: React.ReactNode;
}

export function KbArticleCard({
  article,
  onClick,
  actions,
}: KbArticleCardProps) {
  return (
    <Card
      className={
        onClick
          ? "cursor-pointer hover:border-primary/50 transition-colors"
          : ""
      }
      onClick={onClick}
    >
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {article.code}
            </span>
            <KbStatusBadge status={article.status} />
          </div>
          <p className="truncate text-sm font-medium">{article.title}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3" /> {article.viewCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="size-3" /> {article.helpfulCount}
            </span>
          </div>
        </div>
        {actions && (
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
