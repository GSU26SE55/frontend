import { useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/shared/components/editor/RichTextEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save } from "lucide-react";
import { TagInput } from "@/shared/components/ui/TagInput";
import { KbTemplatePicker } from "@/shared/components/kb/KbTemplatePicker";
import {
  kbArticleSchema,
  type KbArticleFormInput,
  type KbArticleFormValues,
} from "@/features/admin/schemas/kb/kb-article.schema";
import {
  useAdminKbDetail,
  useAdminKbTemplates,
  useCreateKbArticle,
  useUpdateKbArticle,
} from "@/features/admin/hooks/kb/useAdminKb";
import { adminKbService } from "@/features/admin/services/kb/kb.service";
import { KB_CATEGORY_OPTIONS } from "@/shared/enums/kb/kb.enum";
import { TicketCategoryEnum } from "@/shared/enums/ticket/ticket.enum";
import { handleErrorApi } from "@/shared/lib/errors";
import type { KbArticleTemplateDTO } from "@/shared/types/kb/kb.types";

export default function KbEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  const template = !isEdit
    ? (location.state?.template as KbArticleTemplateDTO | undefined)
    : undefined;
  // Soạn bài từ 1 ticket → picker ảnh bật thêm tab "Ảnh từ chat" của ticket đó
  const ticketId = location.state?.ticketId as string | undefined;

  const { data: existing, isLoading } = useAdminKbDetail(id ?? "");
  const { data: templates, isLoading: templatesLoading } =
    useAdminKbTemplates(!isEdit);
  const { mutateAsync: create, isPending: creating } = useCreateKbArticle();
  const { mutateAsync: update, isPending: updating } = useUpdateKbArticle();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
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
    if (existing) {
      reset({
        category: existing.category,
        title: existing.title,
        content: existing.content,
        tags: existing.tags,
        changeDescription: "",
      });
    } else if (template) {
      reset({
        // BE trả category dạng chuỗi enum — dùng thẳng, không map qua code số nữa
        category: template.category ?? TicketCategoryEnum.Charging,
        title: "",
        content: template.content,
        tags: template.tags,
        changeDescription: "",
      });
    }
  }, [existing, template, reset]);

  // Chọn bài mẫu ở trang tạo mới → đổ content HTML vào editor, giữ title trống.
  const handlePickTemplate = async (templateId: string) => {
    const tpl = await adminKbService
      .getTemplateDetail(templateId)
      .then((r) => r.data.data);
    if (!tpl) return;
    setValue("category", tpl.category);
    setValue("content", tpl.content, { shouldValidate: true });
    setValue("tags", tpl.tags ?? []);
  };

  const onSubmit = async (values: KbArticleFormValues) => {
    try {
      // KB luôn nội bộ (Customer xem qua Blog, không xem KB) → isInternalOnly=true.
      const payload = { ...values, isInternalOnly: true, isTemplate: false };
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
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(isEdit ? `/admin/kb/${id}` : "/admin/kb")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Admin &middot; Knowledge Base
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            {isEdit ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-[300px_1fr] gap-4 items-start">
          {/* Cột trái — thông tin chung */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">
                  Tiêu đề <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("title")}
                  placeholder="Hướng dẫn xử lý..."
                  className="text-sm"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium">
                  Danh mục <span className="text-destructive">*</span>
                </label>
                <select
                  {...register("category")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {KB_CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {!isEdit && (
                <KbTemplatePicker
                  templates={templates?.items}
                  isLoading={templatesLoading}
                  onPick={handlePickTemplate}
                  disabled={creating}
                />
              )}

              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <div className="grid gap-1.5">
                    <label className="text-sm font-medium">
                      Thẻ{" "}
                      <span className="text-muted-foreground font-normal">
                        (tối đa 10 thẻ)
                      </span>
                    </label>
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

              {isEdit && (
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">
                    Mô tả thay đổi{" "}
                    <span className="text-muted-foreground font-normal">
                      (tùy chọn)
                    </span>
                  </label>
                  <Input
                    {...register("changeDescription")}
                    placeholder="Lý do/nội dung chỉnh sửa..."
                    className="text-sm"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={creating || updating}
                className="w-full gap-1.5 mt-1"
              >
                <Save className="size-3.5" />
                {isEdit
                  ? updating
                    ? "Đang lưu..."
                    : "Lưu thay đổi"
                  : creating
                    ? "Đang tạo..."
                    : "Tạo bài viết"}
              </Button>
            </CardContent>
          </Card>

          {/* Cột phải — nội dung */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Nội dung</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">
                  Nội dung <span className="text-destructive">*</span>
                </label>
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
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
