import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Archive, History, Copy } from "lucide-react";
import {
  useManagerKbDetail,
  useManagerPublishKbArticle,
  useManagerArchiveKbArticle,
  useManagerApproveKbReview,
  useManagerRejectKbReview,
  useManagerKbVersions,
  useManagerKbCompare,
  useManagerRollbackKbArticle,
  useMarkManagerKbHelpful,
  useManagerDuplicateKbArticle,
} from "@/features/manager/hooks/kb/useManagerKb";
import { KbArticleStatusEnum } from "@/shared/enums/kb/kb.enum";
import {
  KbArticleDetail,
  KbArticleDetailSkeleton,
} from "@/shared/components/kb/KbArticleDetail";
import { KbReviewActions } from "@/shared/components/kb/KbReviewActions";
import { KbVersionDialog } from "@/shared/components/kb/KbVersionDialog";
import type { KbCompareParams } from "@/shared/types/kb/kb.types";

export default function KbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading } = useManagerKbDetail(id!);
  const { mutate: publish } = useManagerPublishKbArticle();
  const { mutate: archive } = useManagerArchiveKbArticle();
  const { mutate: approve, isPending: approving } = useManagerApproveKbReview();
  const { mutate: reject, isPending: rejecting } = useManagerRejectKbReview();
  const { mutate: rollback, isPending: rollingBack } =
    useManagerRollbackKbArticle();
  const { mutate: markHelpful, isPending: helpfulPending } =
    useMarkManagerKbHelpful();
  const { mutateAsync: duplicate, isPending: copyingTemplate } =
    useManagerDuplicateKbArticle();

  const [verOpen, setVerOpen] = useState(false);
  const [compareParams, setCompareParams] = useState<KbCompareParams | null>(
    null,
  );

  const { data: versions } = useManagerKbVersions(verOpen ? id! : "");
  const { data: diff } = useManagerKbCompare(id!, compareParams);

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
        backUrl="/manager/kb"
        breadcrumb="Manager · Knowledge Base"
        onMarkHelpful={() => markHelpful(article.id)}
        helpfulPending={helpfulPending}
        onViewVersions={() => setVerOpen(true)}
        onEdit={() => navigate(`/manager/kb/${article.id}/edit`)}
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
                const created = await duplicate(article.id);
                if (created?.id) navigate(`/manager/kb/${created.id}/edit`);
              }}
            >
              <Copy className="size-3.5" />
              Sao chép
            </Button>
            {article.status === KbArticleStatusEnum.PendingReview && (
              <KbReviewActions
                isPending={approving || rejecting}
                onApprove={() => approve(article.id)}
                onReject={(reason) =>
                  reject({ id: article.id, payload: { reason } })
                }
              />
            )}
            {(article.status === KbArticleStatusEnum.Draft ||
              article.status === KbArticleStatusEnum.PendingReview) && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => publish(article.id)}
              >
                <Upload className="size-3.5" />
                Xuất bản
              </Button>
            )}
            {article.status === KbArticleStatusEnum.Published && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => archive(article.id)}
              >
                <Archive className="size-3.5" />
                Lưu trữ
              </Button>
            )}
          </>
        }
      />

      <KbVersionDialog
        open={verOpen}
        onOpenChange={setVerOpen}
        versions={versions ?? []}
        diff={diff}
        isPending={rollingBack}
        onCompare={(fromVersionId, toVersionId) =>
          setCompareParams({ fromVersionId, toVersionId })
        }
        onRollback={(versionId) =>
          rollback({ id: article.id, payload: { toVersionId: versionId } })
        }
      />
    </>
  );
}
