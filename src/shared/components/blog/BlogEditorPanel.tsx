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
  /** Has a value = edit mode; undefined = create new. */
  existing?: BlogPostDTO;
  templates?: BlogTemplateDTO[];
  /** Return a Promise so the panel can catch errors and map them to fields. */
  onSubmit: (values: BlogPostFormValues) => Promise<unknown>;
  onCancel?: () => void;
  isPending?: boolean;
  /** false while the post is Generating / already Archived. */
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

  // Load data when entering edit mode
  useEffect(() => {
    if (!existing) return;
    reset({
      title: existing.title,
      slug: existing.slug,
      summary: existing.summary,
      contentHtml: existing.contentHtml,
      changeNote: "",
    });
    // No need to setSlugTouched here: the slug-generation effect already skips when isEdit,
    // and isEdit = !!existing, so as soon as data loads the slug stops following the title.
  }, [existing, reset]);

  // Create new: slug follows the title until the user edits the slug themselves
  useEffect(() => {
    if (isEdit || slugTouched) return;
    setValue("slug", slugify(title ?? ""));
  }, [title, isEdit, slugTouched, setValue]);

  const applyTemplate = (templateId: string) => {
    const tpl = templates?.find((t) => t.id === templateId);
    if (tpl) setValue("contentHtml", tpl.contentHtml);
  };

  // Form → try/catch + setError (do NOT use the mutation's onError).
  // EntityError → error under the input; HttpError (e.g. 409 duplicate slug) → toast.
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
        <Label htmlFor="blog-title">Title</Label>
        <Input
          id="blog-title"
          {...register("title")}
          disabled={!editable}
          placeholder="Post title"
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
          placeholder="post-url-slug"
        />
        {errors.slug && (
          <p className="text-destructive text-xs">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="blog-summary">Summary</Label>
        <Textarea
          id="blog-summary"
          rows={3}
          {...register("summary")}
          disabled={!editable}
          placeholder="Short description shown in the list"
        />
        {errors.summary && (
          <p className="text-destructive text-xs">{errors.summary.message}</p>
        )}
      </div>

      {!isEdit && templates && templates.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="blog-template">Apply template (optional)</Label>
          <select
            id="blog-template"
            disabled={!editable}
            defaultValue=""
            onChange={(e) => applyTemplate(e.target.value)}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">— No template —</option>
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
        <Label>Content</Label>
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
          <Label htmlFor="blog-change-note">Change note</Label>
          <Input
            id="blog-change-note"
            {...register("changeNote")}
            disabled={!editable}
            placeholder="Short description of this change (saved to history)"
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending || !editable}>
          {isEdit ? "Save changes" : "Create post"}
        </Button>
      </div>
    </form>
  );
}
