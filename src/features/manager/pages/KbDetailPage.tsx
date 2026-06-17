import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Archive, History } from "lucide-react";
import {
  useManagerKbDetail,
  useManagerPublishKbArticle,
  useManagerArchiveKbArticle,
  useManagerUpdateKbArticle,
  useManagerApproveKbReview,
  useManagerRejectKbReview,
  useManagerKbVersions,
  useManagerKbCompare,
  useManagerRollbackKbArticle,
} from "../hooks/useManagerKb";
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
  const { data: article, isLoading } = useManagerKbDetail(id!);
  const { mutate: publish } = useManagerPublishKbArticle();
  const { mutate: archive } = useManagerArchiveKbArticle();
  const { mutate: approve, isPending: approving } = useManagerApproveKbReview();
  const { mutate: reject, isPending: rejecting } = useManagerRejectKbReview();
  const { mutateAsync: update, isPending: updating } =
    useManagerUpdateKbArticle();
  const { mutate: rollback, isPending: rollingBack } =
    useManagerRollbackKbArticle();

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
