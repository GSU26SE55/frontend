import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableSelectOption {
  value: string;
  /** Chuỗi hiện trên trigger khi option được chọn. */
  label: string;
  /** Nội dung hiện trong dropdown — mặc định dùng `label`. */
  display?: React.ReactNode;
  /** Chuỗi dùng để lọc khi gõ — mặc định dùng `label`. */
  keywords?: string;
}

interface SearchableSelectProps {
  id?: string;
  options: SearchableSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
}

/**
 * Select có ô tìm kiếm. Lọc client-side trên danh sách đã load — không gọi lại
 * API mỗi lần gõ, nên chỉ hợp với list đã fetch sẵn (pageSize 100).
 */
export default function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "-- Chọn --",
  searchPlaceholder = "Tìm kiếm...",
  emptyText = "Không tìm thấy kết quả",
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return options;
    return options.filter((o) =>
      (o.keywords ?? o.label).toLowerCase().includes(kw),
    );
  }, [options, keyword]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setKeyword("");
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {/* base-ui dùng `render` (không phải `asChild` như Radix) — dùng sai thì
          Button thành con của trigger và mất luôn w-full. */}
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !selected && "text-muted-foreground",
              // disabled mặc định opacity-50 làm mờ cả chevron.
              disabled && "disabled:opacity-100 disabled:text-muted-foreground",
            )}
          >
            <span className="truncate">
              {/* Giá trị nằm ngoài danh sách đã load → vẫn hiện raw value thay
                  vì báo "chưa chọn". */}
              {selected?.label ?? (value || placeholder)}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      {/* --anchor-width = bề ngang trigger (base-ui). Radix là
          --radix-popover-trigger-width — biến đó không tồn tại ở đây. */}
      <PopoverContent className="w-(--anchor-width) gap-0 p-0" align="start">
        <div className="border-b p-2">
          <Input
            autoFocus
            placeholder={searchPlaceholder}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  handleOpenChange(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    o.value === value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">{o.display ?? o.label}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
