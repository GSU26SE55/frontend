import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { handleErrorApi } from "@/shared/lib/errors";
import { TicketCategoryEnum } from "@/shared/enums/ticket.enum";
import { KB_CATEGORY_OPTIONS } from "@/shared/enums/kb.enum";
import { TagInput } from "@/shared/components/common/TagInput";
import { KbVisibilityBadge } from "./KbVisibilityBadge";
import type {
  KbArticleDTO,
  UpdateKbArticlePayload,
} from "@/shared/types/kb.types";

// ── Schema (recommendedParts dạng text, mỗi dòng 1 linh kiện → array khi submit) ──
const schema = z.object({
  category: z.nativeEnum(TicketCategoryEnum),
  title: z
    .string()
    .min(1, "Tiêu đề không được trống")
    .max(200, "Tối đa 200 ký tự"),
  symptoms: z
    .string()
    .min(1, "Không được trống")
    .max(2000, "Tối đa 2000 ký tự"),
  diagnosisSteps: z
    .string()
    .min(1, "Không được trống")
    .max(4000, "Tối đa 4000 ký tự"),
  solutionSteps: z
    .string()
    .min(1, "Không được trống")
    .max(4000, "Tối đa 4000 ký tự"),
  recommendedPartsText: z.string().optional(),
  tags: z
    .array(z.string().max(50, "Mỗi thẻ tối đa 50 ký tự"))
    .max(10, "Tối đa 10 thẻ")
    .optional()
    .default([]),
  isInternalOnly: z.boolean(),
  changeDescription: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

// text (mỗi dòng / phẩy) → array
function toList(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

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
  /** Không truyền → chế độ tạo mới */
  article?: KbArticleDTO;
  /** Danh mục mặc định khi tạo mới (vd: category của ticket đang mở) */
  initialCategory?: TicketCategoryEnum;
  onClose: () => void;
  onSave: (payload: UpdateKbArticlePayload) => Promise<void>;
  isPending?: boolean;
}

export function KbEditorPanel({
  article,
  initialCategory,
  onClose,
  onSave,
  isPending,
}: KbEditorPanelProps) {
  const isCreate = !article;

  const defaults = (a?: KbArticleDTO) => ({
    category: a?.category ?? initialCategory ?? TicketCategoryEnum.Charging,
    title: a?.title ?? "",
    symptoms: a?.symptoms ?? "",
    diagnosisSteps: a?.diagnosisSteps ?? "",
    solutionSteps: a?.solutionSteps ?? "",
    recommendedPartsText: (a?.recommendedParts ?? []).join("\n"),
    tags: a?.tags ?? [],
    isInternalOnly: a?.isInternalOnly ?? false,
    changeDescription: "",
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(article),
  });

  // Sync if article changes
  useEffect(() => {
    reset(defaults(article));
  }, [article?.id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values: FormValues) => {
    try {
      await onSave({
        category: values.category,
        title: values.title,
        symptoms: values.symptoms,
        diagnosisSteps: values.diagnosisSteps,
        solutionSteps: values.solutionSteps,
        recommendedParts: toList(values.recommendedPartsText),
        tags: values.tags,
        isInternalOnly: values.isInternalOnly,
        ...(isCreate
          ? {}
          : { changeDescription: values.changeDescription || undefined }),
      });
    } catch (error) {
      handleErrorApi({ error });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          {article && (
            <p className="text-[11px] text-muted-foreground font-mono mb-0.5">
              {article.code}
            </p>
          )}
          <h2 className="text-sm font-semibold">
            {isCreate ? "Tạo bài viết mới" : "Chỉnh sửa bài viết"}
          </h2>
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
              {...register("category")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {KB_CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Controller
            control={control}
            name="isInternalOnly"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  Chỉ nội bộ (ẩn với khách hàng)
                </label>
                <KbVisibilityBadge isInternalOnly={field.value} />
              </div>
            )}
          />
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

          <Field label="Linh kiện khuyến nghị (mỗi dòng 1 linh kiện)">
            <Textarea
              {...register("recommendedPartsText")}
              rows={3}
              placeholder={"Cáp sạc OEM\nCảm biến nhiệt"}
              className="text-sm resize-y"
            />
          </Field>

          <Field label="Thẻ (tối đa 10 thẻ)">
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <TagInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="quá nhiệt, sạc, BMS..."
                  maxTags={10}
                  maxTagLength={50}
                />
              )}
            />
          </Field>
        </div>

        {!isCreate && (
          <>
            <Separator />
            <div className="px-5 py-4 space-y-4">
              <Field label="Mô tả thay đổi (tùy chọn)">
                <Input
                  {...register("changeDescription")}
                  placeholder="Lý do/nội dung chỉnh sửa..."
                  className="text-sm"
                />
              </Field>
            </div>
          </>
        )}
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
          {isPending
            ? isCreate
              ? "Đang tạo..."
              : "Đang lưu..."
            : isCreate
              ? "Tạo bài viết"
              : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}
