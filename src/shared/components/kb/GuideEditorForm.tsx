import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/shared/components/editor/RichTextEditor";
import { TagInput } from "@/shared/components/ui/TagInput";
import {
  kbArticleSchema,
  type KbArticleFormInput,
  type KbArticleFormValues,
} from "@/shared/schemas/kb/kb-article.schema";
import { KB_CATEGORY_OPTIONS } from "@/shared/enums/kb/kb.enum";
import { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";
import type { KbArticleDTO } from "@/shared/types/kb/kb.types";
import { ACTIONS } from "@/shared/constants/actions";

/** Field label plus its error line. Label above, error below, same rhythm on every field. */
function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive"> *</span>}
        {hint && (
          <span className="font-normal text-muted-foreground"> {hint}</span>
        )}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function GuideEditorFormSkeleton() {
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
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Skeleton className="hidden h-64 w-full lg:block" />
      </div>
    </div>
  );
}

interface GuideEditorFormProps {
  /** Portal root for this role, e.g. "/staff/kb". */
  basePath: string;
  /** Set → editing that article. Unset → creating a new one. */
  articleId?: string;
  existing?: KbArticleDTO;
  isSaving?: boolean;
  /** Persists the article. The page owns create vs update and where to go next. */
  onSubmit: (values: KbArticleFormValues) => void | Promise<void>;
  /** Writing from a ticket → the image picker gains that ticket's chat images tab. */
  ticketId?: string;
  /** Suggested category when the article is started from a ticket. */
  initialCategory?: TicketCategoryEnum;
}

/**
 * The Guide editor, shared by all three portals.
 *
 * Writing an article is a long scroll, so Save is pinned to the toolbar rather than parked
 * at the bottom of the form: the content field is the tall one, and the writer should not
 * have to travel to the end of it to keep their work. Everything that is not the article
 * itself (category, tags, change note) moves to a side column so the title and body read
 * as one continuous document.
 */
export function GuideEditorForm({
  basePath,
  articleId,
  existing,
  isSaving,
  onSubmit,
  ticketId,
  initialCategory,
}: GuideEditorFormProps) {
  const navigate = useNavigate();
  const isEdit = !!articleId;
  const cancelUrl = isEdit ? basePath + "/" + articleId : basePath;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<KbArticleFormInput, unknown, KbArticleFormValues>({
    resolver: zodResolver(kbArticleSchema),
    defaultValues: {
      category: initialCategory ?? TicketCategoryEnum.Charging,
      title: "",
      content: "",
      tags: [],
      changeDescription: "",
    },
  });

  useEffect(() => {
    if (!existing) return;
    reset({
      category: existing.category,
      title: existing.title,
      content: existing.content,
      tags: existing.tags,
      changeDescription: "",
    });
  }, [existing, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-24">
      <div className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 py-2.5 pl-(--page-pl) pr-(--page-pr)">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate(cancelUrl)}
          >
            <ArrowLeft className="size-3.5" />
            {ACTIONS.BACK}
          </Button>
          <span className="text-sm font-medium">
            {isEdit ? "Edit article" : "New article"}
          </span>
          {existing && (
            <span className="font-mono text-xs text-muted-foreground">
              {existing.code}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(cancelUrl)}
            >
              {ACTIONS.CANCEL}
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isEdit
                ? isSaving
                  ? "Saving"
                  : ACTIONS.SAVE_CHANGES
                : isSaving
                  ? "Creating"
                  : "Create article"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid w-full items-start gap-8 pt-8 pl-(--page-pl) pr-(--page-pr) lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left: the article itself */}
        <div className="min-w-0 space-y-5">
          <Field
            label="Title"
            htmlFor="kb-title"
            required
            error={errors.title?.message}
          >
            <Input
              id="kb-title"
              {...register("title")}
              placeholder="What does this guide solve?"
              className="h-10 text-base font-medium"
            />
          </Field>

          <Field label="Content" required error={errors.content?.message}>
            <Controller
              control={control}
              name="content"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  ticketId={ticketId}
                />
              )}
            />
          </Field>
        </div>

        {/* Right: everything that describes the article rather than being it */}
        <aside className="space-y-5 rounded-lg border border-border bg-card p-5 lg:sticky lg:top-20">
          <Field label="Category" htmlFor="kb-category" required>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  items={KB_CATEGORY_OPTIONS}
                >
                  <SelectTrigger id="kb-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KB_CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <Field label="Tags" hint="(up to 10)">
                <TagInput
                  placeholder="overheat, charging, BMS"
                  value={field.value ?? []}
                  onChange={field.onChange}
                  maxTags={10}
                  maxTagLength={50}
                />
              </Field>
            )}
          />

          {isEdit && (
            <Field label="Change note" htmlFor="kb-change-description">
              <Input
                id="kb-change-description"
                {...register("changeDescription")}
                placeholder="What changed, and why"
              />
              <p className="text-xs text-muted-foreground">
                Shown to whoever reviews this version.
              </p>
            </Field>
          )}
        </aside>
      </div>
    </form>
  );
}
