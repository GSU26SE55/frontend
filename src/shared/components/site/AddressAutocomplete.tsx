import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useAddressSearch } from "@/shared/hooks/site/useAddressSearch";
import type { GeoResult } from "@/shared/types/site/geocoding.types";

interface AddressAutocompleteProps {
  id?: string;
  value: string;
  /** Fires on every keystroke — keep the address field in sync while typing. */
  onChange: (text: string) => void;
  /** Fires when the user picks a suggestion — carries the resolved lat/long. */
  onSelect: (result: GeoResult) => void;
  placeholder?: string;
}

/**
 * Address input with free geocoding suggestions (Nominatim/OSM). Type an address →
 * a dropdown of matches appears → picking one hands back its coordinates so the
 * caller can auto-fill latitude/longitude.
 */
export default function AddressAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  placeholder = "Type an address to search...",
}: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(value, 400);
  // Only query while the dropdown is open, so picking a suggestion (which sets a
  // long displayName as the value) doesn't trigger a pointless refetch.
  const { data, isFetching } = useAddressSearch(open ? debounced : "");

  const results = data ?? [];
  const showPanel =
    open && debounced.trim().length >= 3 && (isFetching || results.length > 0);

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Suggestions use onMouseDown (preventDefault) so they don't steal focus;
        // any other blur means the user clicked away → close.
        onBlur={() => setOpen(false)}
        autoComplete="off"
      />

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
          {isFetching && results.length === 0 ? (
            <div className="flex items-center gap-2 px-2 py-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching...
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.latitude},${r.longitude},${i}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
                <span className="truncate">{r.displayName}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
