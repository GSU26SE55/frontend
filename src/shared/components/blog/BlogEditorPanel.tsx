import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ACTIONS } from "@/shared/constants/actions";

/** Field label plus its error line. Label above, error below, same rhythm on every field. */
function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {hint && (
          <span className="font-normal text-muted-foreground"> {hint}</span>
        )}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

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

/**
 * The blog editor.
 *
 * Writing a post is a long scroll, so Save is pinned to the toolbar rather than parked at
 * the bottom of the form: the content field is the tall one, and the writer should not
 * have to travel to the end of it to keep their work. Everything that describes the post
 * rather than being it (slug, summary, template, change note) sits in a side column so the
 * title and body read as one continuous document.
 */
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
  const [templateId, setTemplateId] = useState<string | null>(null);

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

  const applyTemplate = (id: string | null) => {
    setTemplateId(id);
    const tpl = templates?.find((t) => t.id === id);
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

  const activeTemplates = templates?.filter((t) => t.isActive) ?? [];
  const templateItems = [
    { value: null, label: "No template" },
    ...activeTemplates.map((t) => ({ value: t.id, label: t.name })),
  ];

  return (
    <form onSubmit={handleSubmit(submit)} className="pb-24">
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 py-2.5 pl-(--page-pl) pr-(--page-pr)">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="size-3.5" />
              {ACTIONS.BACK}
            </Button>
          )}
          <span className="text-sm font-medium">
            {isEdit ? "Edit post" : "New post"}
          </span>
          {existing && (
            <span className="text-xs tabular-nums text-muted-foreground">
              Saving creates version {existing.currentVersion + 1}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
              >
                {ACTIONS.CANCEL}
              </Button>
            )}
            <Button type="submit" size="sm" disabled={isPending || !editable}>
              {isEdit
                ? isPending
                  ? "Saving"
                  : ACTIONS.SAVE_CHANGES
                : isPending
                  ? "Creating"
                  : "Create post"}
            </Button>
          </div>
        </div>
      </div>

      {!editable && (
        <div className="w-full pt-6 pl-(--page-pl) pr-(--page-pr)">
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
            This post is being generated or already archived, so it cannot be
            edited right now.
          </p>
        </div>
      )}

      <div className="grid w-full items-start gap-8 pt-8 pl-(--page-pl) pr-(--page-pr) lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left: the post itself */}
        <div className="min-w-0 space-y-5">
          <Field
            label="Title"
            htmlFor="blog-title"
            error={errors.title?.message}
          >
            <Input
              id="blog-title"
              {...register("title")}
              disabled={!editable}
              placeholder="What is this post about?"
              className="h-10 text-base font-medium"
            />
          </Field>

          <Field label="Content" error={errors.contentHtml?.message}>
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
          </Field>
        </div>

        {/* Right: everything that describes the post rather than being it */}
        <aside className="space-y-5 rounded-lg border border-border bg-card p-5 lg:sticky lg:top-20">
          <Field label="Slug" htmlFor="blog-slug" error={errors.slug?.message}>
            <Input
              id="blog-slug"
              {...register("slug", { onChange: () => setSlugTouched(true) })}
              disabled={!editable}
              placeholder="post-url-slug"
              className="font-mono text-xs"
            />
          </Field>

          <Field
            label="Summary"
            htmlFor="blog-summary"
            error={errors.summary?.message}
          >
            <Textarea
              id="blog-summary"
              rows={4}
              {...register("summary")}
              disabled={!editable}
              placeholder="The line readers see before they open the post"
            />
          </Field>

          {!isEdit && activeTemplates.length > 0 && (
            <Field label="Template">
              <Select
                value={templateId}
                items={templateItems}
                onValueChange={(v: string | null) => applyTemplate(v)}
              >
                <SelectTrigger
                  id="blog-template"
                  className="w-full"
                  disabled={!editable}
                >
                  <SelectValue placeholder="No template" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value={null}>No template</SelectItem>
                  {activeTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Picking one replaces the content you have written.
              </p>
            </Field>
          )}

          {isEdit && (
            <Field label="Change note" htmlFor="blog-change-note">
              <Input
                id="blog-change-note"
                {...register("changeNote")}
                disabled={!editable}
                placeholder="What changed, and why"
              />
              <p className="text-xs text-muted-foreground">
                Saved to the version history.
              </p>
            </Field>
          )}
        </aside>
      </div>
    </form>
  );
}
