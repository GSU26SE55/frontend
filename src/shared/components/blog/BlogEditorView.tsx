import { useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
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

  const cancelUrl =
    isEdit && existing ? `${basePath}/blog/${existing.id}` : `${basePath}/blog`;

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
          // Optimistic concurrency — mismatch with DB → BE returns 409
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
      <div>
        <div className="border-b border-border">
          <div className="flex h-14 w-full items-center gap-3 pl-(--page-pl) pr-(--page-pr)">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="ml-auto h-7 w-40" />
          </div>
        </div>
        <div className="grid w-full gap-8 pt-8 pl-(--page-pl) pr-(--page-pr) lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="hidden h-72 w-full lg:block" />
        </div>
      </div>
    );

  return (
    <BlogEditorPanel
      existing={existing ?? undefined}
      templates={templates}
      isPending={creating || updating}
      editable={!isEdit || isBlogEditable(existing?.status)}
      onSubmit={handleSubmit}
      onCancel={() => navigate(cancelUrl)}
    />
  );
}
