import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save } from "lucide-react";
import {
  kbArticleSchema,
  type KbArticleFormInput,
  type KbArticleFormValues,
} from "../schemas/kb-article.schema";
import {
  useStaffKbDetail,
  useStaffKbCreate,
  useStaffKbUpdate,
} from "../hooks/useStaffKb";
import { KB_CATEGORY_OPTIONS } from "@/shared/enums/kb.enum";
import { TicketCategoryEnum } from "@/shared/enums/ticket.enum";
import { handleErrorApi } from "@/shared/lib/errors";

export default function KbEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

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
      category: TicketCategoryEnum.Charging,
      title: "",
      symptoms: "",
      diagnosisSteps: "",
      solutionSteps: "",
      recommendedParts: [],
      tags: [],
      isInternalOnly: false,
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
        changeDescription: "",
      });
    }
  }, [existing, reset]);

  const onSubmit = async (values: KbArticleFormValues) => {
    try {
      if (isEdit) {
        await update({ id, payload: values });
        navigate(`/staff/kb/${id}`);
      } else {
        const res = await create(values);
        if (res?.id) navigate(`/staff/kb/${res.id}`);
        else navigate("/staff/kb");
      }
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
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

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin chung</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Tiêu đề</label>
              <Input {...register("title")} placeholder="Hướng dẫn xử lý..." />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Danh mục</label>
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
              {errors.category && (
                <p className="text-xs text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>

            <Controller
              control={control}
              name="isInternalOnly"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  Chỉ nội bộ (ẩn với khách hàng)
                </label>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nội dung</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Triệu chứng</label>
              <Textarea
                {...register("symptoms")}
                rows={4}
                placeholder="Mô tả các triệu chứng..."
              />
              {errors.symptoms && (
                <p className="text-xs text-destructive">
                  {errors.symptoms.message}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Bước chẩn đoán</label>
              <Textarea
                {...register("diagnosisSteps")}
                rows={6}
                placeholder="1. Kiểm tra..."
              />
              {errors.diagnosisSteps && (
                <p className="text-xs text-destructive">
                  {errors.diagnosisSteps.message}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Hướng giải quyết</label>
              <Textarea
                {...register("solutionSteps")}
                rows={6}
                placeholder="1. Thực hiện..."
              />
              {errors.solutionSteps && (
                <p className="text-xs text-destructive">
                  {errors.solutionSteps.message}
                </p>
              )}
            </div>

            <Controller
              control={control}
              name="recommendedParts"
              render={({ field }) => (
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">
                    Linh kiện khuyến nghị (mỗi dòng 1 linh kiện)
                  </label>
                  <Textarea
                    rows={3}
                    placeholder={"Cáp sạc OEM\nCảm biến nhiệt"}
                    value={(field.value ?? []).join("\n")}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </div>
              )}
            />

            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">
                    Thẻ (cách nhau bằng dấu phẩy)
                  </label>
                  <Input
                    placeholder="quá nhiệt, sạc, BMS"
                    value={(field.value ?? []).join(", ")}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                  {errors.tags && (
                    <p className="text-xs text-destructive">
                      {errors.tags.message}
                    </p>
                  )}
                </div>
              )}
            />

            {isEdit && (
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">
                  Mô tả thay đổi (tùy chọn)
                </label>
                <Input
                  {...register("changeDescription")}
                  placeholder="Lý do/nội dung chỉnh sửa..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={creating || updating}
            className="gap-1.5"
          >
            <Save className="size-4" />
            {isEdit ? "Lưu thay đổi" : "Tạo bài viết"}
          </Button>
        </div>
      </form>
    </div>
  );
}
