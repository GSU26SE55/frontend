import { useState } from "react";
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
  /** Ngày dạng "yyyy-MM-dd" (khớp value native <input type="date"> cũ). */
  value?: string | null;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Chặn chọn ngày < min (dạng "yyyy-MM-dd"). */
  min?: string;
  /** Chặn chọn ngày > max (dạng "yyyy-MM-dd"). */
  max?: string;
}

/** Thay thế <Input type="date"> — value/onChange giữ nguyên dạng chuỗi "yyyy-MM-dd" để không đổi schema/state chỗ dùng. */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Chọn ngày",
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
        {selected ? format(selected, "dd/MM/yyyy") : placeholder}
      </PopoverTrigger>
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
  /** Ngày giờ dạng "yyyy-MM-ddTHH:mm" (khớp value native <input type="datetime-local"> cũ). */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Chặn chọn thời điểm < min. */
  min?: Date;
  /** Chặn chọn thời điểm > max (vd: `new Date()` — không cho chọn tương lai). */
  max?: Date;
}

/** Thay thế <Input type="datetime-local"> — value/onChange giữ nguyên dạng chuỗi "yyyy-MM-ddTHH:mm". */
export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = "Chọn ngày giờ",
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
        {selected ? format(selected, "dd/MM/yyyy HH:mm") : placeholder}
      </PopoverTrigger>
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
