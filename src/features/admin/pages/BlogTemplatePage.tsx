import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { KEY } from "@/shared/utils/queryKeys";
import { toneClass } from "@/shared/theme/statusColors";
import { loadFailed, noData } from "@/shared/constants/emptyStates";
import {
  useBlogTemplates,
  useDeleteBlogTemplate,
} from "@/shared/hooks/blog/useBlog";
import type { BlogTemplateDTO } from "@/shared/types/blog/blog.types";

export default function BlogTemplatePage() {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState<BlogTemplateDTO | null>(
    null,
  );

  const { data, isLoading, isError, refetch } = useBlogTemplates();
  const { mutate: remove, isPending: removing } = useDeleteBlogTemplate();

  return (
    <div className="mx-auto max-w-360 space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground mb-0.5 text-xs font-medium">
            Admin &middot; Blog
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Mẫu bài blog
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isLoading ? "..." : (data?.length ?? 0)} mẫu &mdash; Staff/Manager
            chỉ đọc, chỉ Admin sửa được.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton queryKeys={[KEY.blogTemplates]} />
          <Button
            size="sm"
            onClick={() => navigate("/admin/blog/templates/new")}
          >
            <Plus className="size-3.5" /> Tạo mẫu
          </Button>
        </div>
      </div>

      {isError ? (
        <ErrorState message={loadFailed("mẫu blog")} onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {noData("mẫu blog")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-medium">{tpl.name}</h3>
                  <Badge
                    variant="outline"
                    className={toneClass(tpl.isActive ? "ok" : "muted")}
                  >
                    {tpl.isActive ? "Đang dùng" : "Đã tắt"}
                  </Badge>
                </div>
                {tpl.description && (
                  <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                    {tpl.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2 border-t border-border/60 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    navigate(`/admin/blog/templates/${tpl.id}/edit`)
                  }
                >
                  <Pencil className="size-3.5" /> Sửa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={removing}
                  onClick={() => setConfirmDelete(tpl)}
                >
                  <Trash2 className="size-3.5" /> Xóa
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa mẫu?</AlertDialogTitle>
            <AlertDialogDescription>
              Mẫu &ldquo;{confirmDelete?.name}&rdquo; sẽ bị xóa. Bài viết đã tạo
              từ mẫu này không bị ảnh hưởng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) remove(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
