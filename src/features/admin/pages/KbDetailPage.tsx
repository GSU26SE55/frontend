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
  useApproveKbReview,
  useRejectKbReview,
  useAdminKbVersions,
  useAdminKbCompare,
  useRollbackKbArticle,
  useMarkKbHelpful,
  useDeleteKbArticle,
  useDuplicateKbArticle,
} from "@/features/admin/hooks/kb/useAdminKb";
import { KbArticleStatusEnum } from "@/shared/enums/kb/kb.enum";
import {
  KbArticleDetail,
  KbArticleDetailSkeleton,
} from "@/shared/components/kb/KbArticleDetail";
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
  const { mutate: rollback, isPending: rollingBack } = useRollbackKbArticle();
  const { mutate: markHelpful, isPending: helpfulPending } = useMarkKbHelpful();
  const { mutate: deleteArticle, isPending: deleting } = useDeleteKbArticle();
  const { mutateAsync: duplicate, isPending: copyingTemplate } =
    useDuplicateKbArticle();

  const [verOpen, setVerOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [compareParams, setCompareParams] = useState<KbCompareParams | null>(
    null,
  );

  const { data: versions } = useAdminKbVersions(verOpen ? id! : "");
  const { data: diff } = useAdminKbCompare(id!, compareParams);

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
        backUrl="/admin/kb"
        breadcrumb="Admin · Knowledge Base"
        onMarkHelpful={() => markHelpful(article.id)}
        helpfulPending={helpfulPending}
        onViewVersions={() => setVerOpen(true)}
        onEdit={() => navigate(`/admin/kb/${article.id}/edit`)}
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
              onClick={() => setStatsOpen(true)}
            >
              <BarChart3 className="size-3.5" />
              Stats
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={copyingTemplate}
              onClick={async () => {
                const created = await duplicate(article.id);
                if (created?.id) navigate(`/admin/kb/${created.id}/edit`);
              }}
            >
              <Copy className="size-3.5" />
              Duplicate
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
                Publish
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
                Archive
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
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete KB article?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Article <strong>{article.code}</strong> will be permanently
                    deleted. This action can't be undone.
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
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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

      <KbUsageStatsDialog
        articleId={article.id}
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
      />
    </>
  );
}
