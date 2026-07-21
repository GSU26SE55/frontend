import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Pencil,
  Upload,
  Archive,
  Trash2,
  History,
} from "lucide-react";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { RichContentView } from "@/shared/components/editor/RichContentView";
import { BlogStatusBadge, BlogOriginBadge } from "./BlogStatusBadge";
import { BlogVersionHistory } from "./BlogVersionHistory";
import { BlogDiffViewer } from "./BlogDiffViewer";
import {
  useBlogDetail,
  useBlogGenerationStatus,
  useBlogVersions,
  useBlogCompare,
  usePublishBlogPost,
  useArchiveBlogPost,
  useDeleteBlogPost,
  isBlogEditable,
} from "@/shared/hooks/blog/useBlog";
import { BlogPostStatusEnum } from "@/shared/enums/blog/blog.enum";
import type { BlogCompareParams } from "@/shared/types/blog/blog.types";

interface BlogDetailViewProps {
  basePath: string;
  /** Manager/Admin mới có publish · archive · xóa. */
  canWorkflow?: boolean;
}

export function BlogDetailView({ basePath, canWorkflow }: BlogDetailViewProps) {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showVersions, setShowVersions] = useState(false);
  const [compareParams, setCompareParams] = useState<BlogCompareParams | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: post, isLoading, isError, refetch } = useBlogDetail(id);

  // Bài đang được AI sinh → poll tới khi Draft / GenerationFailed
  const isGenerating = post?.status === BlogPostStatusEnum.Generating;
  useBlogGenerationStatus(id, isGenerating);

  const { data: versions } = useBlogVersions(showVersions ? id : "");
  const { data: diff } = useBlogCompare(id, compareParams);

  const { mutate: publish, isPending: publishing } = usePublishBlogPost();
  const { mutate: archive, isPending: archiving } = useArchiveBlogPost();
  const { mutate: remove, isPending: removing } = useDeleteBlogPost();

  if (isError)
    return (
      <div className="p-6">
        <ErrorState
          message="Không tìm thấy bài viết hoặc bạn không có quyền xem."
          onRetry={refetch}
        />
      </div>
    );

  if (isLoading || !post)
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  const editable = isBlogEditable(post.status);
  const canPublish = post.status === BlogPostStatusEnum.Draft;

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`${basePath}/blog`)}
      >
        <ArrowLeft className="size-3.5" /> Danh sách blog
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {post.title}
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            /{post.slug} &middot; v{post.currentVersion} &middot;{" "}
            {format(new Date(post.createdAt), "dd/MM/yyyy HH:mm")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <BlogStatusBadge status={post.status} />
            <BlogOriginBadge origin={post.origin} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVersions(true)}
          >
            <History className="size-3.5" /> Lịch sử
          </Button>
          <Button
            size="sm"
            disabled={!editable}
            title={editable ? undefined : "Bài đang được tạo hoặc đã lưu trữ"}
            onClick={() => navigate(`${basePath}/blog/${post.id}/edit`)}
          >
            <Pencil className="size-3.5" /> Sửa
          </Button>

          {canWorkflow && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={!canPublish || publishing}
                onClick={() => publish(post.id)}
              >
                <Upload className="size-3.5" /> Xuất bản
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  archiving || post.status === BlogPostStatusEnum.Archived
                }
                onClick={() => archive(post.id)}
              >
                <Archive className="size-3.5" /> Lưu trữ
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={removing}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-3.5" /> Xóa
              </Button>
            </>
          )}
        </div>
      </div>

      {post.status === BlogPostStatusEnum.Generating && (
        <Card className="border-info/40 bg-info/5 p-3 text-sm">
          AI đang tạo nội dung. Trang sẽ tự cập nhật khi xong.
        </Card>
      )}

      {post.status === BlogPostStatusEnum.GenerationFailed && (
        <Card className="border-destructive/40 bg-destructive/5 p-3 text-sm">
          AI tạo nội dung thất bại. Bạn vẫn có thể bấm <strong>Sửa</strong> để
          soạn thủ công.
        </Card>
      )}

      <Card className="p-5">
        <p className="text-muted-foreground mb-3 text-sm italic">
          {post.summary}
        </p>
        <RichContentView html={post.contentHtml} />
      </Card>

      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Lịch sử phiên bản</DialogTitle>
          </DialogHeader>
          <BlogVersionHistory
            versions={versions ?? []}
            onCompare={(oldVersionNumber, newVersionNumber) =>
              setCompareParams({ oldVersionNumber, newVersionNumber })
            }
          />
          {diff && (
            <div className="mt-3 border-t pt-3">
              <BlogDiffViewer diff={diff} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
            <AlertDialogDescription>
              Bài &ldquo;{post.title}&rdquo; sẽ bị xóa. Không thể khôi phục qua
              giao diện.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                remove(post.id, {
                  onSuccess: () => navigate(`${basePath}/blog`),
                })
              }
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
