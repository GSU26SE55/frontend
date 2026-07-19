import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { History, Copy } from "lucide-react";
import {
  useStaffKbDetail,
  useStaffKbUpdate,
  useStaffKbVersions,
  useStaffKbCompare,
  useStaffKbVersionDetail,
  useMarkStaffKbHelpful,
  useStaffKbCopyTemplate,
} from "@/features/staff/hooks/kb/useStaffKb";
import {
  KbArticleDetail,
  KbArticleDetailSkeleton,
} from "@/shared/components/kb/KbArticleDetail";
import { KbEditorPanel } from "@/shared/components/kb/KbEditorPanel";
import { KbVersionDialog } from "@/shared/components/kb/KbVersionDialog";
import type { KbCompareParams } from "@/shared/types/kb/kb.types";

export default function KbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading } = useStaffKbDetail(id!);
  const { mutateAsync: update, isPending: updating } = useStaffKbUpdate();
  const { mutate: markHelpful, isPending: helpfulPending } =
    useMarkStaffKbHelpful();
  const { mutateAsync: copyTemplate, isPending: copyingTemplate } =
    useStaffKbCopyTemplate();

  const [verOpen, setVerOpen] = useState(false);
  const [compareParams, setCompareParams] = useState<KbCompareParams | null>(
    null,
  );
  const [viewVersionId, setViewVersionId] = useState<string | null>(null);

  const { data: versions } = useStaffKbVersions(verOpen ? id! : "");
  const { data: diff } = useStaffKbCompare(id!, compareParams);
  const { data: versionDetail } = useStaffKbVersionDetail(id!, viewVersionId);

  if (isLoading) return <KbArticleDetailSkeleton />;

  if (!article) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Không tìm thấy bài viết.
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
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setVerOpen(true)}
            >
              <History className="size-3.5" />
              Phiên bản
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={copyingTemplate}
              onClick={async () => {
                const template = await copyTemplate(article.id);
                if (template)
                  navigate("/staff/kb/new", { state: { template } });
              }}
            >
              <Copy className="size-3.5" />
              Sao chép template
            </Button>
          </>
        }
        renderEditor={({ onClose }) => (
          <KbEditorPanel
            article={article}
            onClose={onClose}
            isPending={updating}
            onSave={async (payload) => {
              await update({ id: article.id, payload });
              onClose();
            }}
          />
        )}
      />

      <KbVersionDialog
        open={verOpen}
        onOpenChange={setVerOpen}
        versions={versions ?? []}
        diff={diff}
        versionDetail={versionDetail}
        onCompare={(fromVersionId, toVersionId) =>
          setCompareParams({ fromVersionId, toVersionId })
        }
        onViewVersion={(versionId) => setViewVersionId(versionId || null)}
      />
    </>
  );
}
