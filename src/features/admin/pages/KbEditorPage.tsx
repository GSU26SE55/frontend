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
} from "@/features/admin/schemas/kb/kb-article.schema";
import {
  useAdminKbDetail,
  useCreateKbArticle,
  useUpdateKbArticle,
} from "@/features/admin/hooks/kb/useAdminKb";
import { KB_CATEGORY_OPTIONS } from "@/shared/enums/kb/kb.enum";
import { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";
import { handleErrorApi } from "@/shared/lib/errors";

export default function KbEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  // Soạn bài từ 1 ticket → picker ảnh bật thêm tab "Ảnh từ chat" của ticket đó
  const ticketId = location.state?.ticketId as string | undefined;

  const { data: existing, isLoading } = useAdminKbDetail(id ?? "");
  const { mutateAsync: create, isPending: creating } = useCreateKbArticle();
  const { mutateAsync: update, isPending: updating } = useUpdateKbArticle();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<KbArticleFormInput, unknown, KbArticleFormValues>({
    resolver: zodResolver(kbArticleSchema),
    defaultValues: {
      category: TicketCategoryEnum.Charging,
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
      // KB luôn nội bộ (Customer xem qua Blog, không xem KB) → isInternalOnly=true.
      const payload = { ...values, isInternalOnly: true };
      if (isEdit) {
        await update({ id, payload });
        navigate(`/admin/kb/${id}`);
      } else {
        const res = await create(payload);
        if (res?.id) navigate(`/admin/kb/${res.id}`);
        else navigate("/admin/kb");
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
        onClick={() => navigate(isEdit ? `/admin/kb/${id}` : "/admin/kb")}
      >
        <ArrowLeft className="size-3.5" /> Quay lại
      </Button>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          Admin &middot; Knowledge Base
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
        </h1>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="kb-title">
              Tiêu đề <span className="text-destructive">*</span>
            </Label>
            <Input
              id="kb-title"
              {...register("title")}
              placeholder="Hướng dẫn xử lý..."
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kb-category">
              Danh mục <span className="text-destructive">*</span>
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
                  Thẻ{" "}
                  <span className="text-muted-foreground font-normal">
                    (tối đa 10 thẻ)
                  </span>
                </Label>
                <TagInput
                  placeholder="quá nhiệt, sạc, BMS..."
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
              Nội dung <span className="text-destructive">*</span>
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
              <Label htmlFor="kb-change-description">
                Mô tả thay đổi{" "}
                <span className="text-muted-foreground font-normal">
                  (tùy chọn)
                </span>
              </Label>
              <Input
                id="kb-change-description"
                {...register("changeDescription")}
                placeholder="Lý do/nội dung chỉnh sửa..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEdit ? `/admin/kb/${id}` : "/admin/kb")}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={creating || updating}>
              <Save className="size-3.5" />
              {isEdit
                ? updating
                  ? "Đang lưu..."
                  : "Lưu thay đổi"
                : creating
                  ? "Đang tạo..."
                  : "Tạo bài viết"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
