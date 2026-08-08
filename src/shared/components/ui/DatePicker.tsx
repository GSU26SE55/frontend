import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { enUS } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DATE_FORMAT = "yyyy-MM-dd";
const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm";

function parseDateValue(value: string | undefined | null): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, DATE_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

interface DatePickerProps {
  id?: string;
  /** Date as "yyyy-MM-dd" (matches the native <input type="date"> value it replaced). */
  value?: string | null;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Blocks selecting a date < min (as "yyyy-MM-dd"). */
  min?: string;
  /** Blocks selecting a date > max (as "yyyy-MM-dd"). */
  max?: string;
}

/** Replaces <Input type="date"> — value/onChange keep the "yyyy-MM-dd" string format so the schema/state at call sites doesn't change. */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  className,
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDateValue(value);
  const minDate = parseDateValue(min);
  const maxDate = parseDateValue(max);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start font-normal",
              !selected && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-3.5" />
        {selected ? format(selected, "MM/dd/yyyy") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={enUS}
          selected={selected}
          defaultMonth={selected}
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : []),
          ]}
          onSelect={(date) => {
            onChange(date ? format(date, DATE_FORMAT) : undefined);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function parseDateTimeValue(
  value: string | undefined | null,
): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, DATETIME_FORMAT, new Date());
  return isValid(parsed) ? parsed : undefined;
}

interface DateTimePickerProps {
  id?: string;
  /** Date-time as "yyyy-MM-ddTHH:mm" (matches the native <input type="datetime-local"> value it replaced). */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Blocks selecting a moment < min. */
  min?: Date;
  /** Blocks selecting a moment > max (e.g. `new Date()` — disallows selecting the future). */
  max?: Date;
}

/** Replaces <Input type="datetime-local"> — value/onChange keep the "yyyy-MM-ddTHH:mm" string format. */
export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = "Select date & time",
  disabled,
  className,
  min,
  max,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDateTimeValue(value);
  const timeValue = selected ? format(selected, "HH:mm") : "";

  const clamp = (date: Date): Date => {
    if (min && date < min) return new Date(min);
    if (max && date > max) return new Date(max);
    return date;
  };

  const commit = (date: Date | undefined, time: string) => {
    if (!date) {
      onChange("");
      return;
    }
    const [hours, minutes] = time ? time.split(":").map(Number) : [0, 0];
    const next = new Date(date);
    next.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    onChange(format(clamp(next), DATETIME_FORMAT));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start font-normal",
              !selected && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-3.5" />
        {selected ? format(selected, "MM/dd/yyyy HH:mm") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={enUS}
          selected={selected}
          defaultMonth={selected}
          disabled={[
            ...(min ? [{ before: min }] : []),
            ...(max ? [{ after: max }] : []),
          ]}
          onSelect={(date) => commit(date, timeValue || "00:00")}
        />
        <div className="flex items-center gap-2 border-t border-border p-2.5">
          <Input
            type="time"
            value={timeValue}
            disabled={!selected}
            onChange={(e) => commit(selected, e.target.value)}
            className="h-8"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
