import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { History, Copy } from "lucide-react";
import {
  useStaffKbDetail,
  useStaffKbVersions,
  useStaffKbCompare,
  useMarkStaffKbHelpful,
  useStaffDuplicateKbArticle,
} from "@/features/staff/hooks/kb/useStaffKb";
import {
  KbArticleDetail,
  KbArticleDetailSkeleton,
} from "@/shared/components/kb/KbArticleDetail";
import { KbVersionDialog } from "@/shared/components/kb/KbVersionDialog";
import type { KbCompareParams } from "@/shared/types/kb/kb.types";

export default function KbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading } = useStaffKbDetail(id!);
  const { mutate: markHelpful, isPending: helpfulPending } =
    useMarkStaffKbHelpful();
  const { mutateAsync: duplicate, isPending: copyingTemplate } =
    useStaffDuplicateKbArticle();

  const [verOpen, setVerOpen] = useState(false);
  const [compareParams, setCompareParams] = useState<KbCompareParams | null>(
    null,
  );

  const { data: versions } = useStaffKbVersions(verOpen ? id! : "");
  const { data: diff } = useStaffKbCompare(id!, compareParams);

  if (isLoading) return <KbArticleDetailSkeleton />;

  if (!article) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No matching article.
      </div>
    );
  }

  return (
    <>
      <KbArticleDetail
        article={article}
        backUrl="/staff/kb"
        breadcrumb="Staff · Knowledge Base"
        onMarkHelpful={() => markHelpful(article.id)}
        helpfulPending={helpfulPending}
        onViewVersions={() => setVerOpen(true)}
        onEdit={() => navigate(`/staff/kb/${article.id}/edit`)}
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setVerOpen(true)}
            >
              <History className="size-3.5" />
              Versions
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={copyingTemplate}
              onClick={async () => {
                const created = await duplicate(article.id);
                if (created?.id) navigate(`/staff/kb/${created.id}/edit`);
              }}
            >
              <Copy className="size-3.5" />
              Duplicate
            </Button>
          </>
        }
      />

      <KbVersionDialog
        open={verOpen}
        onOpenChange={setVerOpen}
        versions={versions ?? []}
        diff={diff}
        onCompare={(fromVersionId, toVersionId) =>
          setCompareParams({ fromVersionId, toVersionId })
        }
      />
    </>
  );
}
