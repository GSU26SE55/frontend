import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Archive, History } from "lucide-react";
import {
  useAdminKbDetail,
  usePublishKbArticle,
  useArchiveKbArticle,
  useUpdateKbArticle,
  useApproveKbReview,
  useRejectKbReview,
  useAdminKbVersions,
  useAdminKbCompare,
  useRollbackKbArticle,
} from "../hooks/useAdminKb";
import { KbArticleStatusEnum } from "@/shared/enums/kb.enum";
import {
  KbArticleDetail,
  KbArticleDetailSkeleton,
} from "@/shared/components/common/kb/KbArticleDetail";
import { KbEditorPanel } from "@/shared/components/common/kb/KbEditorPanel";
import { KbReviewActions } from "@/shared/components/common/kb/KbReviewActions";
import { KbVersionDialog } from "@/shared/components/common/kb/KbVersionDialog";
import type { KbCompareParams } from "@/shared/types/kb.types";

export default function KbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: article, isLoading } = useAdminKbDetail(id!);
  const { mutate: publish } = usePublishKbArticle();
  const { mutate: archive } = useArchiveKbArticle();
  const { mutate: approve, isPending: approving } = useApproveKbReview();
  const { mutate: reject, isPending: rejecting } = useRejectKbReview();
  const { mutateAsync: update, isPending: updating } = useUpdateKbArticle();
  const { mutate: rollback, isPending: rollingBack } = useRollbackKbArticle();

  const [verOpen, setVerOpen] = useState(false);
  const [compareParams, setCompareParams] = useState<KbCompareParams | null>(
    null,
  );
  const { data: versions } = useAdminKbVersions(verOpen ? id! : "");
  const { data: diff } = useAdminKbCompare(id!, compareParams);

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
        backUrl="/admin/kb"
        breadcrumb="Admin · Knowledge Base"
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
