import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Archive } from "lucide-react";
import {
  useManagerKbDetail,
  useManagerPublishKbArticle,
  useManagerArchiveKbArticle,
  useManagerUpdateKbArticle,
} from "../hooks/useManagerKb";
import { KbArticleStatusEnum } from "@/shared/enums/kb.enum";
import {
  KbArticleDetail,
  KbArticleDetailSkeleton,
} from "@/shared/components/common/kb/KbArticleDetail";
import { KbEditorPanel } from "@/shared/components/common/kb/KbEditorPanel";

export default function KbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: article, isLoading } = useManagerKbDetail(id!);
  const { mutate: publish } = useManagerPublishKbArticle();
  const { mutate: archive } = useManagerArchiveKbArticle();
  const { mutateAsync: update, isPending: updating } = useManagerUpdateKbArticle();

  if (isLoading) return <KbArticleDetailSkeleton />;

  if (!article) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Không tìm thấy bài viết.
      </div>
    );
  }

  return (
    <KbArticleDetail
      article={article}
      backUrl="/manager/kb"
      breadcrumb="Manager · Knowledge Base"
      actions={
        <>
          {article.status === KbArticleStatusEnum.Draft && (
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
  );
}
