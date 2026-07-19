import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { ErrorState } from "@/shared/components/ui/ErrorState";
import { RichTextEditor } from "@/shared/components/editor/RichTextEditor";
import { handleErrorApi } from "@/shared/lib/errors";
import { KEY } from "@/shared/utils/queryKeys";
import { toneClass } from "@/shared/theme/statusColors";
import { loadFailed, noData } from "@/shared/constants/emptyStates";
import {
  useBlogTemplates,
  useCreateBlogTemplate,
  useUpdateBlogTemplate,
  useDeleteBlogTemplate,
} from "@/shared/hooks/blog/useBlog";
import {
  blogTemplateSchema,
  type BlogTemplateFormInput,
  type BlogTemplateFormValues,
} from "@/shared/schemas/blog/blog-template.schema";
import type { BlogTemplateDTO } from "@/shared/types/blog/blog.types";

export default function BlogTemplatePage() {
  const [editing, setEditing] = useState<BlogTemplateDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<BlogTemplateDTO | null>(
    null,
  );

  const { data, isLoading, isError, refetch } = useBlogTemplates();
  const { mutateAsync: create, isPending: saving } = useCreateBlogTemplate();
  const { mutateAsync: update, isPending: updating } = useUpdateBlogTemplate();
  const { mutate: remove, isPending: removing } = useDeleteBlogTemplate();

  const open = creating || !!editing;

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<BlogTemplateFormInput, unknown, BlogTemplateFormValues>({
    resolver: zodResolver(blogTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      contentHtml: "",
      isActive: true,
    },
  });

  const openCreate = () => {
    reset({ name: "", description: "", contentHtml: "", isActive: true });
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (tpl: BlogTemplateDTO) => {
    reset({
      name: tpl.name,
      description: tpl.description ?? "",
      contentHtml: tpl.contentHtml,
      isActive: tpl.isActive,
    });
    setCreating(false);
    setEditing(tpl);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const submit = async (values: BlogTemplateFormValues) => {
    try {
      if (editing) {
        await update({ id: editing.id, payload: values });
      } else {
        await create(values);
      }
      close();
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

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
          <Button size="sm" onClick={openCreate}>
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
        <div className="space-y-2">
          {data.map((tpl) => (
            <Card
              key={tpl.id}
              className="flex flex-wrap items-start justify-between gap-3 p-4"
            >
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
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(tpl)}
                >
                  <Pencil className="size-3.5" /> Sửa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
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

      <Dialog open={open} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa mẫu" : "Tạo mẫu"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(submit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Tên mẫu</Label>
              <Input id="tpl-name" {...register("name")} />
              {errors.name && (
                <p className="text-destructive text-xs">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-desc">Mô tả</Label>
              <Textarea id="tpl-desc" rows={2} {...register("description")} />
            </div>

            <div className="space-y-1.5">
              <Label>Nội dung mẫu</Label>
              <Controller
                control={control}
                name="contentHtml"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.contentHtml && (
                <p className="text-destructive text-xs">
                  {errors.contentHtml.message}
                </p>
              )}
            </div>

            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  Cho phép dùng mẫu này khi soạn bài
                </label>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>
                Hủy
              </Button>
              <Button type="submit" disabled={saving || updating}>
                {editing ? "Lưu thay đổi" : "Tạo mẫu"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
