import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/shared/components/editor/RichTextEditor";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const { data: existing, isLoading } = useStaffKbDetail(id ?? "");
  const { mutateAsync: create, isPending: creating } = useStaffKbCreate();
  const { mutateAsync: update, isPending: updating } = useStaffKbUpdate();

  const [partsText, setPartsText] = useState("");

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
      symptoms: "",
      diagnosisSteps: "",
      solutionSteps: "",
      recommendedParts: [],
      tags: [],
      isInternalOnly: false,
      isTemplate: false,
      changeDescription: "",
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        category: existing.category,
        title: existing.title,
        symptoms: existing.symptoms,
        diagnosisSteps: existing.diagnosisSteps,
        solutionSteps: existing.solutionSteps,
        recommendedParts: existing.recommendedParts ?? [],
        tags: existing.tags,
        isInternalOnly: existing.isInternalOnly,
        isTemplate: existing.isTemplate,
        changeDescription: "",
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPartsText((existing.recommendedParts ?? []).join("\n"));
    } else if (template) {
      reset({
        // BE trả category dạng chuỗi enum — dùng thẳng, không map qua code số nữa
        category: template.category ?? TicketCategoryEnum.Charging,
        title: "",
        symptoms: template.symptoms,
        diagnosisSteps: template.diagnosisSteps,
        solutionSteps: template.solutionSteps,
        recommendedParts: template.recommendedParts ?? [],
        tags: template.tags,
        isInternalOnly: false,
        isTemplate: false,
        changeDescription: "",
      });
      setPartsText((template.recommendedParts ?? []).join("\n"));
    }
  }, [existing, template, reset]);

  const onSubmit = async (values: KbArticleFormValues) => {
    try {
      const payload = {
        ...values,
        recommendedParts: partsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
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
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(isEdit ? `/staff/kb/${id}` : "/staff/kb")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            Staff &middot; Knowledge Base
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

              <Controller
                control={control}
                name="isInternalOnly"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                    Chỉ nội bộ (ẩn với khách hàng)
                  </label>
                )}
              />

              <Controller
                control={control}
                name="isTemplate"
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                    Dùng làm bài mẫu (Staff copy cấu trúc)
                  </label>
                )}
              />

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
                  Triệu chứng <span className="text-destructive">*</span>
                </label>
                <Controller
                  control={control}
                  name="symptoms"
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      ticketId={ticketId}
                    />
                  )}
                />
                {errors.symptoms && (
                  <p className="text-xs text-destructive">
                    {errors.symptoms.message}
                  </p>
                )}
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium">
                  Bước chẩn đoán <span className="text-destructive">*</span>
                </label>
                <Controller
                  control={control}
                  name="diagnosisSteps"
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      ticketId={ticketId}
                    />
                  )}
                />
                {errors.diagnosisSteps && (
                  <p className="text-xs text-destructive">
                    {errors.diagnosisSteps.message}
                  </p>
                )}
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium">
                  Hướng giải quyết <span className="text-destructive">*</span>
                </label>
                <Controller
                  control={control}
                  name="solutionSteps"
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      ticketId={ticketId}
                    />
                  )}
                />
                {errors.solutionSteps && (
                  <p className="text-xs text-destructive">
                    {errors.solutionSteps.message}
                  </p>
                )}
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium">
                  Linh kiện khuyến nghị{" "}
                  <span className="text-muted-foreground font-normal">
                    (mỗi dòng 1 linh kiện)
                  </span>
                </label>
                <Textarea
                  rows={2}
                  placeholder={"Cáp sạc OEM\nCảm biến nhiệt"}
                  value={partsText}
                  onChange={(e) => setPartsText(e.target.value)}
                  className="text-sm resize-y"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
