import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  Archive,
  History,
  Trash2,
  Copy,
  BarChart3,
} from "lucide-react";
import { KbUsageStatsDialog } from "@/features/admin/components/kb/KbUsageStatsDialog";
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
  useAdminKbVersionDetail,
  useMarkKbHelpful,
  useDeleteKbArticle,
  useCopyKbTemplate,
} from "@/features/admin/hooks/kb/useAdminKb";
import { KbArticleStatusEnum } from "@/shared/enums/kb/kb.enum";
import {
  KbArticleDetail,
  KbArticleDetailSkeleton,
} from "@/shared/components/kb/KbArticleDetail";
import { KbEditorPanel } from "@/shared/components/kb/KbEditorPanel";
import { KbReviewActions } from "@/shared/components/kb/KbReviewActions";
import { KbVersionDialog } from "@/shared/components/kb/KbVersionDialog";
import type { KbCompareParams } from "@/shared/types/kb/kb.types";
import { ACTIONS } from "@/shared/constants/actions";

export default function KbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading } = useAdminKbDetail(id!);
  const { mutate: publish } = usePublishKbArticle();
  const { mutate: archive } = useArchiveKbArticle();
  const { mutate: approve, isPending: approving } = useApproveKbReview();
  const { mutate: reject, isPending: rejecting } = useRejectKbReview();
  const { mutateAsync: update, isPending: updating } = useUpdateKbArticle();
  const { mutate: rollback, isPending: rollingBack } = useRollbackKbArticle();
  const { mutate: markHelpful, isPending: helpfulPending } = useMarkKbHelpful();
  const { mutate: deleteArticle, isPending: deleting } = useDeleteKbArticle();
  const { mutateAsync: copyTemplate, isPending: copyingTemplate } =
    useCopyKbTemplate();

  const [verOpen, setVerOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [compareParams, setCompareParams] = useState<KbCompareParams | null>(
    null,
  );
  const [viewVersionId, setViewVersionId] = useState<string | null>(null);

  const { data: versions } = useAdminKbVersions(verOpen ? id! : "");
  const { data: diff } = useAdminKbCompare(id!, compareParams);
  const { data: versionDetail } = useAdminKbVersionDetail(id!, viewVersionId);

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
              onClick={() => setStatsOpen(true)}
            >
              <BarChart3 className="size-3.5" />
              Thống kê
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={copyingTemplate}
              onClick={async () => {
                const template = await copyTemplate(article.id);
                if (template)
                  navigate("/admin/kb/new", { state: { template } });
              }}
            >
              <Copy className="size-3.5" />
              Sao chép template
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
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                    disabled={deleting}
                  />
                }
              >
                <Trash2 className="size-3.5" />
                Xóa
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa bài viết KB?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bài viết <strong>{article.code}</strong> sẽ bị xóa vĩnh
                    viễn. Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{ACTIONS.CANCEL}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() =>
                      deleteArticle(article.id, {
                        onSuccess: () => navigate("/admin/kb"),
                      })
                    }
                  >
                    Xóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
        isPending={rollingBack}
        onCompare={(fromVersionId, toVersionId) =>
          setCompareParams({ fromVersionId, toVersionId })
        }
        onViewVersion={(versionId) => setViewVersionId(versionId || null)}
        onRollback={(versionId) =>
          rollback({ id: article.id, payload: { toVersionId: versionId } })
        }
      />

      <KbUsageStatsDialog
        articleId={article.id}
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
      />
    </>
  );
}
