import { useMemo } from "react";
import SearchableSelect from "@/shared/components/ui/SearchableSelect";
import type { CustomerDropdownItem } from "@/shared/types/battery/battery-asset.types";

interface CustomerComboboxProps {
  id?: string;
  customers: CustomerDropdownItem[];
  value?: string;
  onChange: (customerId: string) => void;
  disabled?: boolean;
}

/**
 * Customer select with a search box — matches on both name and email.
 */
export default function CustomerCombobox({
  id,
  customers,
  value,
  onChange,
  disabled,
}: CustomerComboboxProps) {
  const options = useMemo(
    () =>
      customers.map((c) => ({
        value: c.id,
        label: `${c.fullName} (${c.email})`,
        display: (
          <>
            {c.fullName}{" "}
            <span className="text-muted-foreground">({c.email})</span>
          </>
        ),
      })),
    [customers],
  );

  return (
    <SearchableSelect
      id={id}
      options={options}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder="-- Select a customer --"
      searchPlaceholder="Search by name or email..."
      emptyText="No matching customers"
    />
  );
}
