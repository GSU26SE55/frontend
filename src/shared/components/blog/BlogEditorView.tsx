import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { BlogEditorPanel } from "./BlogEditorPanel";
import {
  useBlogDetail,
  useBlogTemplates,
  useCreateBlogPost,
  useUpdateBlogPost,
  isBlogEditable,
} from "@/shared/hooks/blog/useBlog";
import type { BlogPostFormValues } from "@/shared/schemas/blog/blog-post.schema";

interface BlogEditorViewProps {
  basePath: string;
}

export function BlogEditorView({ basePath }: BlogEditorViewProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existing, isLoading } = useBlogDetail(id ?? "");
  const { data: templates } = useBlogTemplates({ isActive: true });
  const { mutateAsync: create, isPending: creating } = useCreateBlogPost();
  const { mutateAsync: update, isPending: updating } = useUpdateBlogPost();

  const handleSubmit = async (values: BlogPostFormValues) => {
    if (isEdit && existing) {
      await update({
        id: existing.id,
        payload: {
          title: values.title,
          slug: values.slug,
          summary: values.summary,
          contentHtml: values.contentHtml,
          changeNote: values.changeNote,
          // Optimistic concurrency — lệch với DB → BE trả 409
          currentVersion: existing.currentVersion,
        },
      });
      navigate(`${basePath}/blog/${existing.id}`);
      return;
    }

    const res = await create({
      title: values.title,
      slug: values.slug,
      summary: values.summary,
      contentHtml: values.contentHtml,
      blogTemplateId: values.blogTemplateId,
    });
    if (res?.id) navigate(`${basePath}/blog/${res.id}`);
  };

  if (isEdit && isLoading)
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          navigate(
            isEdit && existing
              ? `${basePath}/blog/${existing.id}`
              : `${basePath}/blog`,
          )
        }
      >
        <ArrowLeft className="size-3.5" /> Quay lại
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? "Sửa bài viết" : "Tạo bài viết"}
        </h1>
        {isEdit && existing && (
          <p className="text-muted-foreground mt-1 text-sm">
            Đang sửa phiên bản v{existing.currentVersion}. Lưu thành công sẽ tạo
            phiên bản mới.
          </p>
        )}
      </div>

      <Card className="p-5">
        <BlogEditorPanel
          existing={existing ?? undefined}
          templates={templates}
          isPending={creating || updating}
          editable={!isEdit || isBlogEditable(existing?.status)}
          onSubmit={handleSubmit}
          onCancel={() =>
            navigate(
              isEdit && existing
                ? `${basePath}/blog/${existing.id}`
                : `${basePath}/blog`,
            )
          }
        />
      </Card>
    </div>
  );
}
