import { useParams } from "react-router-dom";
import { useStaffKbDetail } from "../hooks/useStaffKb";
import {
  KbArticleDetail,
  KbArticleDetailSkeleton,
} from "@/shared/components/common/kb/KbArticleDetail";

export default function KbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: article, isLoading } = useStaffKbDetail(id!);

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
      backUrl="/staff/kb"
      breadcrumb="Staff · Knowledge Base"
    />
  );
}
