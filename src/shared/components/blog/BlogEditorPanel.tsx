import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/shared/components/editor/RichTextEditor";
import { slugify } from "@/shared/lib/slugify";
import { handleErrorApi } from "@/shared/lib/errors";
import {
  blogPostSchema,
  type BlogPostFormInput,
  type BlogPostFormValues,
} from "@/shared/schemas/blog/blog-post.schema";
import type {
  BlogPostDTO,
  BlogTemplateDTO,
} from "@/shared/types/blog/blog.types";

interface BlogEditorPanelProps {
  /** Có giá trị = chế độ sửa; undefined = tạo mới. */
  existing?: BlogPostDTO;
  templates?: BlogTemplateDTO[];
  /** Trả về Promise để panel bắt lỗi và map xuống field. */
  onSubmit: (values: BlogPostFormValues) => Promise<unknown>;
  onCancel?: () => void;
  isPending?: boolean;
  /** false khi bài đang Generating / đã Archived. */
  editable?: boolean;
}

export function BlogEditorPanel({
  existing,
  templates,
  onSubmit,
  onCancel,
  isPending,
  editable = true,
}: BlogEditorPanelProps) {
  const isEdit = !!existing;
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<BlogPostFormInput, unknown, BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      summary: "",
      contentHtml: "",
      changeNote: "",
    },
  });

  const title = useWatch({ control, name: "title" });

  // Nạp dữ liệu khi vào chế độ sửa
  useEffect(() => {
    if (!existing) return;
    reset({
      title: existing.title,
      slug: existing.slug,
      summary: existing.summary,
      contentHtml: existing.contentHtml,
      changeNote: "",
    });
    // Không cần setSlugTouched ở đây: effect sinh slug đã bỏ qua khi isEdit,
    // mà isEdit = !!existing nên vừa có dữ liệu là slug thôi bám theo title.
  }, [existing, reset]);

  // Tạo mới: slug bám theo title cho tới khi user tự sửa slug
  useEffect(() => {
    if (isEdit || slugTouched) return;
    setValue("slug", slugify(title ?? ""));
  }, [title, isEdit, slugTouched, setValue]);

  const applyTemplate = (templateId: string) => {
    const tpl = templates?.find((t) => t.id === templateId);
    if (tpl) setValue("contentHtml", tpl.contentHtml);
  };

  // Form → try/catch + setError (KHÔNG dùng onError của mutation).
  // EntityError → lỗi dưới input; HttpError (vd 409 slug trùng) → toast.
  const submit = async (values: BlogPostFormValues) => {
    try {
      await onSubmit(values);
    } catch (error) {
      handleErrorApi({ error, setError });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="blog-title">Tiêu đề</Label>
        <Input
          id="blog-title"
          {...register("title")}
          disabled={!editable}
          placeholder="Tiêu đề bài viết"
        />
        {errors.title && (
          <p className="text-destructive text-xs">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="blog-slug">Slug</Label>
        <Input
          id="blog-slug"
          {...register("slug", { onChange: () => setSlugTouched(true) })}
          disabled={!editable}
          placeholder="duong-dan-bai-viet"
        />
        {errors.slug && (
          <p className="text-destructive text-xs">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="blog-summary">Tóm tắt</Label>
        <Textarea
          id="blog-summary"
          rows={3}
          {...register("summary")}
          disabled={!editable}
          placeholder="Mô tả ngắn hiển thị ở danh sách"
        />
        {errors.summary && (
          <p className="text-destructive text-xs">{errors.summary.message}</p>
        )}
      </div>

      {!isEdit && templates && templates.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="blog-template">Áp dụng mẫu (tùy chọn)</Label>
          <select
            id="blog-template"
            disabled={!editable}
            defaultValue=""
            onChange={(e) => applyTemplate(e.target.value)}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">— Không dùng mẫu —</option>
            {templates
              .filter((t) => t.isActive)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Nội dung</Label>
        <Controller
          control={control}
          name="contentHtml"
          render={({ field }) => (
            <RichTextEditor
              value={field.value ?? ""}
              onChange={field.onChange}
              disabled={!editable}
            />
          )}
        />
        {errors.contentHtml && (
          <p className="text-destructive text-xs">
            {errors.contentHtml.message}
          </p>
        )}
      </div>

      {isEdit && (
        <div className="space-y-1.5">
          <Label htmlFor="blog-change-note">Ghi chú thay đổi</Label>
          <Input
            id="blog-change-note"
            {...register("changeNote")}
            disabled={!editable}
            placeholder="Mô tả ngắn thay đổi lần này (lưu vào lịch sử)"
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
        )}
        <Button type="submit" disabled={isPending || !editable}>
          {isEdit ? "Lưu thay đổi" : "Tạo bài viết"}
        </Button>
      </div>
    </form>
  );
}
