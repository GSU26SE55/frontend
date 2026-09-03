import { useEffect, useRef, useState } from "react";
import { format, parse, isValid } from "date-fns";
import { vi } from "date-fns/locale";
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

const TYPED_DATE_FORMAT = "dd/MM/yyyy";

/** Replaces <Input type="date"> — value/onChange keep the "yyyy-MM-dd" string format so the schema/state at call sites doesn't change. Supports both typing "dd/MM/yyyy" directly and picking from the calendar popover. */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  disabled,
  className,
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDateValue(value);
  const minDate = parseDateValue(min);
  const maxDate = parseDateValue(max);

  const [text, setText] = useState(
    selected ? format(selected, TYPED_DATE_FORMAT) : "",
  );
  const isTypingRef = useRef(false);
  // Keep the typed text in sync when the value changes from outside (calendar pick, form reset/prefill) —
  // skipped while the user is actively typing so a not-yet-valid partial date isn't overwritten mid-keystroke.
  useEffect(() => {
    if (isTypingRef.current) return;
    setText(selected ? format(selected, TYPED_DATE_FORMAT) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commitTyped = (raw: string) => {
    isTypingRef.current = true;
    setText(raw);
    if (!raw) {
      onChange(undefined);
      return;
    }
    const parsed = parse(raw, TYPED_DATE_FORMAT, new Date());
    if (isValid(parsed)) {
      if (minDate && parsed < minDate) return;
      if (maxDate && parsed > maxDate) return;
      onChange(format(parsed, DATE_FORMAT));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative flex items-center", className)}>
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          placeholder={placeholder}
          value={text}
          onChange={(e) => commitTyped(e.target.value)}
          onBlur={() => {
            isTypingRef.current = false;
          }}
          className="pr-9"
        />
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              className="absolute right-1 text-muted-foreground"
            />
          }
        >
          <CalendarIcon className="size-3.5" />
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={vi}
          selected={selected}
          defaultMonth={selected}
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : []),
          ]}
          onSelect={(date) => {
            onChange(date ? format(date, DATE_FORMAT) : undefined);
            setText(date ? format(date, TYPED_DATE_FORMAT) : "");
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

const TYPED_DATETIME_FORMAT = "dd/MM/yyyy HH:mm";

/** Replaces <Input type="datetime-local"> — value/onChange keep the "yyyy-MM-ddTHH:mm" string format. Supports both typing "dd/MM/yyyy HH:mm" directly and picking from the calendar popover. */
export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = "DD/MM/YYYY HH:mm",
  disabled,
  className,
  min,
  max,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDateTimeValue(value);
  const timeValue = selected ? format(selected, "HH:mm") : "";

  const [text, setText] = useState(
    selected ? format(selected, TYPED_DATETIME_FORMAT) : "",
  );
  const isTypingRef = useRef(false);
  useEffect(() => {
    if (isTypingRef.current) return;
    setText(selected ? format(selected, TYPED_DATETIME_FORMAT) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const clamp = (date: Date): Date => {
    if (min && date < min) return new Date(min);
    if (max && date > max) return new Date(max);
    return date;
  };

  const commit = (date: Date | undefined, time: string) => {
    if (!date) {
      onChange("");
      setText("");
      return;
    }
    const [hours, minutes] = time ? time.split(":").map(Number) : [0, 0];
    const next = new Date(date);
    next.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    const clamped = clamp(next);
    onChange(format(clamped, DATETIME_FORMAT));
    setText(format(clamped, TYPED_DATETIME_FORMAT));
  };

  const commitTyped = (raw: string) => {
    isTypingRef.current = true;
    setText(raw);
    if (!raw) {
      onChange("");
      return;
    }
    const parsed = parse(raw, TYPED_DATETIME_FORMAT, new Date());
    if (isValid(parsed)) {
      if (min && parsed < min) return;
      if (max && parsed > max) return;
      onChange(format(parsed, DATETIME_FORMAT));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative flex items-center", className)}>
        <Input
          id={id}
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={text}
          onChange={(e) => commitTyped(e.target.value)}
          onBlur={() => {
            isTypingRef.current = false;
          }}
          className="pr-9"
        />
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              className="absolute right-1 text-muted-foreground"
            />
          }
        >
          <CalendarIcon className="size-3.5" />
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={vi}
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
