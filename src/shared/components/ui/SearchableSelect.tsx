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
  /** String shown on the trigger when the option is selected. */
  label: string;
  /** Content shown in the dropdown — defaults to `label`. */
  display?: React.ReactNode;
  /** String used for filtering while typing — defaults to `label`. */
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
 * Select with a search box. Filters client-side over the already-loaded list — it doesn't
 * call the API on every keystroke, so it only suits a list that's already been fetched (pageSize 100).
 */
export default function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "-- Select --",
  searchPlaceholder = "Search...",
  emptyText = "No results",
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
      {/* base-ui uses `render` (not `asChild` like Radix) — get it wrong and the
          Button becomes a child of the trigger and loses w-full. */}
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
              // disabled defaults to opacity-50, which also fades the chevron.
              disabled && "disabled:opacity-100 disabled:text-muted-foreground",
            )}
          >
            <span className="truncate">
              {/* Value falls outside the loaded list → still show the raw value
                  instead of reporting "not selected". */}
              {selected?.label ?? (value || placeholder)}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      {/* --anchor-width = trigger width (base-ui). Radix uses
          --radix-popover-trigger-width — that variable doesn't exist here. */}
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
