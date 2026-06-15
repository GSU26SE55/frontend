import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KbStatusBadge } from "@/shared/components/common/kb/KbStatusBadge";
import { ArrowLeft, Pencil, Upload, Archive, Eye, ThumbsUp } from "lucide-react";
import {
  useAdminKbDetail,
  usePublishKbArticle,
  useArchiveKbArticle,
} from "../hooks/useAdminKb";
import { KbArticleStatusEnum } from "@/shared/enums/kb.enum";

export default function KbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading } = useAdminKbDetail(id!);
  const { mutate: publish } = usePublishKbArticle();
  const { mutate: archive } = useArchiveKbArticle();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Không tìm thấy bài viết.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/kb")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Knowledge Base &middot; {article.code}
          </p>
          <h1 className="text-xl font-semibold tracking-tight truncate">
            {article.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <KbStatusBadge status={article.status} />
          {article.status === KbArticleStatusEnum.Draft && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => publish(article.id)}
            >
              <Upload className="size-3.5" /> Xuất bản
            </Button>
          )}
          {article.status === KbArticleStatusEnum.Published && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => archive(article.id)}
            >
              <Archive className="size-3.5" /> Lưu trữ
            </Button>
          )}
          <Button
            size="sm"
            className="gap-1"
            onClick={() => navigate(`/admin/kb/${article.id}/edit`)}
          >
            <Pencil className="size-3.5" /> Chỉnh sửa
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Eye className="size-3.5" /> {article.viewCount} lượt xem
        </span>
        <span className="inline-flex items-center gap-1">
          <ThumbsUp className="size-3.5" /> {article.helpfulCount} hữu ích
        </span>
        <span>Phiên bản {article.version}</span>
        {article.createdByFullName && (
          <span>Tạo bởi {article.createdByFullName}</span>
        )}
      </div>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Triệu chứng</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{article.symptoms}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bước chẩn đoán</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {article.diagnosisSteps}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hướng giải quyết</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {article.solutionSteps}
            </p>
          </CardContent>
        </Card>

        {article.recommendedParts && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Linh kiện khuyến nghị</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {article.recommendedParts}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
