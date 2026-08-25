import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterFieldProps {
  icon: React.ElementType;
  /** Accessible name for the box, e.g. "Search" or "Tag". */
  label: string;
  placeholder: string;
  className?: string;
  /** State from useDebouncedSearch. */
  state: {
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
  };
  /** Drops the committed filter, since clearing the box alone only stops the debounce. */
  onClear: () => void;
}

/**
 * Filter text box: icon on the left, clear affordance on the right once there is a value.
 *
 * Clearing has to do two things (reset the local debounced value AND drop the committed
 * filter), which is exactly the pair every list page used to re-write by hand.
 */
export function FilterField({
  icon: Icon,
  label,
  placeholder,
  className,
  state,
  onClear,
}: FilterFieldProps) {
  return (
    <div className={cn("relative", className)}>
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label={label}
        placeholder={placeholder}
        value={state.value}
        onChange={state.onChange}
        className="pl-8 pr-8"
      />
      {state.value && (
        <button
          type="button"
          onClick={() => {
            state.onChange({
              target: { value: "" },
            } as React.ChangeEvent<HTMLInputElement>);
            onClear();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={"Clear " + label.toLowerCase()}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
