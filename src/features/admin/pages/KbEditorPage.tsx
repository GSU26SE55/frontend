import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save } from "lucide-react";
import {
  kbArticleSchema,
  type KbArticleFormInput,
  type KbArticleFormValues,
} from "../schemas/kb-article.schema";
import {
  useAdminKbDetail,
  useCreateKbArticle,
  useUpdateKbArticle,
} from "../hooks/useAdminKb";
import { handleErrorApi } from "@/shared/lib/errors";

export default function KbEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existing, isLoading } = useAdminKbDetail(id ?? "");
  const { mutateAsync: create, isPending: creating } = useCreateKbArticle();
  const { mutateAsync: update, isPending: updating } = useUpdateKbArticle();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<KbArticleFormInput, unknown, KbArticleFormValues>({
    resolver: zodResolver(kbArticleSchema),
    defaultValues: {
      category: 0,
      title: "",
      symptoms: "",
      diagnosisSteps: "",
      solutionSteps: "",
      recommendedParts: "",
      tags: [],
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
        recommendedParts: existing.recommendedParts ?? "",
        tags: existing.tags,
      });
    }
  }, [existing, reset]);

  const onSubmit = async (values: KbArticleFormValues) => {
    try {
      if (isEdit) {
        await update({ id, payload: values });
        navigate(`/admin/kb/${id}`);
      } else {
        const res = await create(values);
        if (res.data?.id) navigate(`/admin/kb/${res.data.id}`);
        else navigate("/admin/kb");
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

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin chung</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Tiêu đề</label>
              <Input
                {...register("title")}
                placeholder="Hướng dẫn xử lý..."
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Danh mục</label>
              <Input
                type="number"
                {...register("category", { valueAsNumber: true })}
                placeholder="Mã danh mục (số)"
              />
              {errors.category && (
                <p className="text-xs text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>
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

            <div className="grid gap-1.5">
              <label className="text-sm font-medium">
                Linh kiện khuyến nghị
              </label>
              <Textarea
                {...register("recommendedParts")}
                rows={3}
                placeholder="Danh sách linh kiện (nếu có)..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={creating || updating} className="gap-1.5">
            <Save className="size-4" />
            {isEdit ? "Lưu thay đổi" : "Tạo bài viết"}
          </Button>
        </div>
      </form>
    </div>
  );
}
