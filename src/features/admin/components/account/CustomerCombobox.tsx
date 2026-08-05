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
import type { CustomerDropdownItem } from "@/shared/types/battery/battery-asset.types";

interface CustomerComboboxProps {
  id?: string;
  customers: CustomerDropdownItem[];
  value?: string;
  onChange: (customerId: string) => void;
  disabled?: boolean;
}

/**
 * Select khách hàng có ô tìm kiếm. Lọc client-side trên danh sách đã load
 * (useCustomers pageSize 100) — không gọi lại API mỗi lần gõ.
 */
export default function CustomerCombobox({
  id,
  customers,
  value,
  onChange,
  disabled,
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const selected = customers.find((c) => c.id === value);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(kw) ||
        c.email.toLowerCase().includes(kw),
    );
  }, [customers, keyword]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setKeyword("");
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {selected
              ? `${selected.fullName} (${selected.email})`
              : // Khách hàng ngoài 100 bản ghi đã load (thường gặp khi sửa site cũ)
                // → vẫn hiện id thay vì báo "chưa chọn"
                (value ?? "") || "-- Chọn khách hàng --"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <div className="border-b p-2">
          <Input
            autoFocus
            placeholder="Tìm theo tên hoặc email..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              Không tìm thấy khách hàng
            </p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c.id);
                  handleOpenChange(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    c.id === value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="truncate">
                  {c.fullName}{" "}
                  <span className="text-muted-foreground">({c.email})</span>
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
