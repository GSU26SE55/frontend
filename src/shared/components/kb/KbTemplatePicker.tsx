import { useState } from "react";
import { FileText } from "lucide-react";
import type { KbArticleSummaryDTO } from "@/shared/types/kb/kb.types";

interface KbTemplatePickerProps {
  /** Danh sách bài mẫu (IsTemplate=true). */
  templates: KbArticleSummaryDTO[] | undefined;
  isLoading?: boolean;
  /** Chọn 1 template → parent fetch content HTML rồi đổ vào editor. */
  onPick: (templateId: string) => void;
  disabled?: boolean;
}

/**
 * Dropdown chọn bài mẫu khi TẠO MỚI KB. Chọn 1 mẫu → parent lấy content HTML
 * đổ vào Tiptap để user điền tiếp. Bỏ trống = soạn từ đầu.
 */
export function KbTemplatePicker({
  templates,
  isLoading,
  onPick,
  disabled,
}: KbTemplatePickerProps) {
  const [value, setValue] = useState("");

  if (!isLoading && (!templates || templates.length === 0)) return null;

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium flex items-center gap-1.5">
        <FileText className="size-3.5 text-muted-foreground" />
        Dùng bài mẫu{" "}
        <span className="text-muted-foreground font-normal">(tùy chọn)</span>
      </label>
      <select
        value={value}
        disabled={disabled || isLoading}
        onChange={(e) => {
          const id = e.target.value;
          setValue(id);
          if (id) onPick(id);
        }}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">
          {isLoading ? "Đang tải mẫu..." : "— Soạn từ đầu —"}
        </option>
        {templates?.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
    </div>
  );
}
