import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  maxTagLength?: number;
  disabled?: boolean;
  className?: string;
}

/** Nhập nhiều thẻ dạng chip — Enter hoặc dấu phẩy để thêm, Backspace ở ô trống để xóa thẻ cuối. */
export function TagInput({
  value,
  onChange,
  placeholder = "Nhập rồi Enter...",
  maxTags,
  maxTagLength,
  disabled,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const atLimit = !!maxTags && value.length >= maxTags;

  const commit = (raw: string) => {
    const tag = raw.trim();
    if (!tag || atLimit) {
      setDraft("");
      return;
    }
    if (value.includes(tag)) {
      setDraft("");
      return;
    }
    if (maxTagLength && tag.length > maxTagLength) return;
    onChange([...value, tag]);
    setDraft("");
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeAt(value.length - 1);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {value.map((tag, i) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
          <span className="max-w-[160px] truncate">{tag}</span>
          <button
            type="button"
            onClick={() => removeAt(i)}
            className="rounded hover:bg-muted-foreground/20"
            aria-label={`Xóa thẻ ${tag}`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(draft)}
        placeholder={value.length === 0 ? placeholder : ""}
        disabled={disabled || atLimit}
        className="min-w-[80px] flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
