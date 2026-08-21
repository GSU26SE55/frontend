import { useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/shared/components/editor/RichTextEditor";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save } from "lucide-react";
import { TagInput } from "@/shared/components/ui/TagInput";
import {
  kbArticleSchema,
  type KbArticleFormInput,
  type KbArticleFormValues,
} from "@/features/staff/schemas/kb/kb-article.schema";
import {
  useStaffKbDetail,
  useStaffKbCreate,
  useStaffKbUpdate,
} from "@/features/staff/hooks/kb/useStaffKb";
import { KB_CATEGORY_OPTIONS } from "@/shared/enums/kb/kb.enum";
import { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";
import { handleErrorApi } from "@/shared/lib/errors";

export default function KbEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  // Writing from a ticket → the image picker gets an extra "Photos from chat" tab for that ticket
  const ticketId = location.state?.ticketId as string | undefined;
  // Suggested category when creating from a ticket (the ticket's category).
  const initialCategory = location.state?.category as
    | TicketCategoryEnum
    | undefined;

  const { data: existing, isLoading } = useStaffKbDetail(id ?? "");
  const { mutateAsync: create, isPending: creating } = useStaffKbCreate();
  const { mutateAsync: update, isPending: updating } = useStaffKbUpdate();

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

  const onSubmit = async (values: KbArticleFormValues) => {
    try {
      // KB is always internal (Customers view via Blog, not KB) → isInternalOnly=true.
      const payload = { ...values, isInternalOnly: true };
      if (isEdit) {
        await update({ id, payload });
        navigate(`/staff/kb/${id}`);
      } else {
        const res = await create(payload);
        if (res?.id) navigate(`/staff/kb/${res.id}`);
        else navigate("/staff/kb");
      }
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-100 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(isEdit ? `/staff/kb/${id}` : "/staff/kb")}
      >
        <ArrowLeft className="size-3.5" /> Back
      </Button>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          Staff &middot; Guide
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? "Edit article" : "Create new article"}
        </h1>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="kb-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="kb-title"
              {...register("title")}
              placeholder="How to resolve..."
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kb-category">
              Category <span className="text-destructive">*</span>
            </Label>
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
          </div>

          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <div className="space-y-1.5">
                <Label>
                  Tags{" "}
                  <span className="text-muted-foreground font-normal">
                    (up to 10 tags)
                  </span>
                </Label>
                <TagInput
                  placeholder="overheating, charging, BMS..."
                  value={field.value ?? []}
                  onChange={field.onChange}
                  maxTags={10}
                  maxTagLength={50}
                />
              </div>
            )}
          />

          <div className="space-y-1.5">
            <Label>
              Content <span className="text-destructive">*</span>
            </Label>
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
            {errors.content && (
              <p className="text-xs text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="kb-change-description">Change description</Label>
              <Input
                id="kb-change-description"
                {...register("changeDescription")}
                placeholder="Reason for / content of the change..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEdit ? `/staff/kb/${id}` : "/staff/kb")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating || updating}>
              <Save className="size-3.5" />
              {isEdit
                ? updating
                  ? "Saving..."
                  : "Save changes"
                : creating
                  ? "Creating..."
                  : "Create article"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
