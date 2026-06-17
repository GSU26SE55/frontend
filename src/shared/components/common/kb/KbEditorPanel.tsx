import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  KbArticleDTO,
  UpdateKbArticlePayload,
} from "@/shared/types/kb.types";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  category: z.number().min(1, "Chọn danh mục"),
  title: z
    .string()
    .min(1, "Tiêu đề không được trống")
    .max(200, "Tối đa 200 ký tự"),
  symptoms: z.string().min(1, "Không được trống"),
  diagnosisSteps: z.string().min(1, "Không được trống"),
  solutionSteps: z.string().min(1, "Không được trống"),
  recommendedParts: z.string().optional(),
  tags: z.array(z.string()),
});

type FormValues = z.output<typeof schema>;

// ── Category options ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 1, label: "Pin lỗi" },
  { value: 2, label: "Kết nối mạng" },
  { value: 3, label: "Phần cứng" },
  { value: 4, label: "Phần mềm" },
  { value: 5, label: "Cảnh báo môi trường" },
  { value: 6, label: "Bảo trì định kỳ" },
  { value: 7, label: "Khác" },
];

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
interface KbEditorPanelProps {
  article: KbArticleDTO;
  onClose: () => void;
  onSave: (payload: UpdateKbArticlePayload) => Promise<void>;
  isPending?: boolean;
}

export function KbEditorPanel({
  article,
  onClose,
  onSave,
  isPending,
}: KbEditorPanelProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: article.category,
      title: article.title,
      symptoms: article.symptoms,
      diagnosisSteps: article.diagnosisSteps,
      solutionSteps: article.solutionSteps,
      recommendedParts: article.recommendedParts ?? "",
      tags: article.tags ?? [],
    },
  });

  // Sync if article changes
  useEffect(() => {
    reset({
      category: article.category,
      title: article.title,
      symptoms: article.symptoms,
      diagnosisSteps: article.diagnosisSteps,
      solutionSteps: article.solutionSteps,
      recommendedParts: article.recommendedParts ?? "",
      tags: article.tags ?? [],
    });
  }, [article.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values: FormValues) => {
    try {
      await onSave(values);
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <p className="text-[11px] text-muted-foreground font-mono mb-0.5">
            {article.code}
          </p>
          <h2 className="text-sm font-semibold">Chỉnh sửa bài viết</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Body */}
      <form
        id="kb-editor-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 overflow-y-auto"
      >
        <div className="px-5 py-4 space-y-4">
          {/* General info */}
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Thông tin chung
          </p>

          <Field label="Tiêu đề" required error={errors.title?.message}>
            <Input
              {...register("title")}
              placeholder="Hướng dẫn xử lý..."
              className="text-sm"
            />
          </Field>

          <Field label="Danh mục" required error={errors.category?.message}>
            <select
              {...register("category", { valueAsNumber: true })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value={0} disabled>
                Chọn danh mục
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Separator />

        <div className="px-5 py-4 space-y-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Nội dung
          </p>

          <Field label="Triệu chứng" required error={errors.symptoms?.message}>
            <Textarea
              {...register("symptoms")}
              rows={4}
              placeholder="Mô tả các triệu chứng..."
              className="text-sm resize-y"
            />
          </Field>

          <Field
            label="Bước chẩn đoán"
            required
            error={errors.diagnosisSteps?.message}
          >
            <Textarea
              {...register("diagnosisSteps")}
              rows={5}
              placeholder="1. Kiểm tra..."
              className="text-sm resize-y"
            />
          </Field>

          <Field
            label="Hướng giải quyết"
            required
            error={errors.solutionSteps?.message}
          >
            <Textarea
              {...register("solutionSteps")}
              rows={5}
              placeholder="1. Thực hiện..."
              className="text-sm resize-y"
            />
          </Field>

          <Field label="Linh kiện khuyến nghị">
            <Textarea
              {...register("recommendedParts")}
              rows={3}
              placeholder="Danh sách linh kiện (nếu có)..."
              className="text-sm resize-y"
            />
          </Field>
        </div>
      </form>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isPending}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          form="kb-editor-form"
          size="sm"
          disabled={isPending}
          className="gap-1.5"
        >
          <Save className="size-3.5" />
          {isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}
