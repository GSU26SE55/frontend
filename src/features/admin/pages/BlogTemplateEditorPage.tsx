import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { RichTextEditor } from "@/shared/components/editor/RichTextEditor";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  useBlogTemplateDetail,
  useCreateBlogTemplate,
  useUpdateBlogTemplate,
} from "@/shared/hooks/blog/useBlog";
import {
  blogTemplateSchema,
  type BlogTemplateFormInput,
  type BlogTemplateFormValues,
} from "@/shared/schemas/blog/blog-template.schema";

export default function BlogTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existing, isLoading } = useBlogTemplateDetail(id ?? "");
  const { mutateAsync: create, isPending: creating } = useCreateBlogTemplate();
  const { mutateAsync: update, isPending: updating } = useUpdateBlogTemplate();

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

  useEffect(() => {
    if (!existing) return;
    reset({
      name: existing.name,
      description: existing.description ?? "",
      contentHtml: existing.contentHtml,
      isActive: existing.isActive,
    });
  }, [existing, reset]);

  const submit = async (values: BlogTemplateFormValues) => {
    try {
      if (isEdit) {
        await update({ id, payload: values });
      } else {
        await create(values);
      }
      navigate("/admin/blog/templates");
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 p-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin/blog/templates")}
      >
        <ArrowLeft className="size-3.5" /> Quay lại
      </Button>

      <div>
        <p className="text-muted-foreground mb-0.5 text-xs font-medium">
          Admin &middot; Blog
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? "Sửa mẫu" : "Tạo mẫu"}
        </h1>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">Tên mẫu</Label>
            <Input id="tpl-name" {...register("name")} />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name.message}</p>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/blog/templates")}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={creating || updating}>
              {isEdit ? "Lưu thay đổi" : "Tạo mẫu"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
