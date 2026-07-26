import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StaffMultiSelectOption {
  value: string;
  label: string;
}

interface Props {
  options: StaffMultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyText?: string;
}

/**
 * Combobox multi-select (chip + input inline + dropdown ✓) — chọn Staff phụ (Collaborator).
 * Gõ để lọc, click item để toggle (giữ nguyên trong list kèm ✓), × để bỏ chip. Chỉ UI.
 */
export default function StaffMultiSelect({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = "Thêm nhân viên hỗ trợ...",
  emptyText = "Không có nhân viên khả dụng",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selectedOptions = value
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is StaffMultiSelectOption => Boolean(o));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const toggle = (val: string) => {
    onChange(
      value.includes(val) ? value.filter((v) => v !== val) : [...value, val],
    );
  };
  const remove = (val: string) => onChange(value.filter((v) => v !== val));

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger box: chips + input inline */}
      <div
        onClick={() => {
          if (disabled) return;
          setOpen(true);
          inputRef.current?.focus();
        }}
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs transition-colors",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-text",
        )}
      >
        {selectedOptions.map((o) => (
          <Badge key={o.value} variant="secondary" className="gap-1 pr-1">
            {o.label}
            <button
              type="button"
              aria-label={`Bỏ ${o.label}`}
              onClick={(e) => {
                e.stopPropagation();
                remove(o.value);
              }}
              className="ml-0.5 rounded-sm px-0.5 text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground"
            >
              ×
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          placeholder={selectedOptions.length === 0 ? placeholder : ""}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && query === "" && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
          className="min-w-[6rem] flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Dropdown */}
      {open && !disabled && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {filtered.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              {options.length === 0 ? emptyText : "Không tìm thấy"}
            </div>
          )}
          {filtered.map((o) => {
            const selected = value.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  selected && "font-medium",
                )}
              >
                <span className="truncate">{o.label}</span>
                {selected && <span className="ml-2 text-primary">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
