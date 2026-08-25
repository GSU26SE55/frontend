import { useRef, type KeyboardEvent, type ClipboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { DUR, EASE_OUT } from "@/shared/motion/tokens";

interface OtpBoxInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  hasError?: boolean;
  length?: number;
}

const OtpBoxInput = ({
  value,
  onChange,
  onBlur,
  disabled,
  hasError,
  length = 6,
}: OtpBoxInputProps) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const reduced = useReducedMotion();

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    onChange(next.join(""));
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        onChange(next.join(""));
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    refs.current[focusIndex]?.focus();
  };

  return (
    // A wrong code shakes the row once. Entering a one-time code is rare and the
    // failure is worth making unmissable — the delight budget spends fine here.
    <motion.div
      className="flex justify-center gap-2"
      animate={
        hasError && !reduced
          ? {
              transform: [
                "translateX(0px)",
                "translateX(-4px)",
                "translateX(4px)",
                "translateX(-2px)",
                "translateX(0px)",
              ],
            }
          : { transform: "translateX(0px)" }
      }
      transition={{ duration: 0.3, ease: EASE_OUT }}
    >
      {digits.map((digit, index) => (
        <motion.input
          key={index}
          // A filled box nudges up in scale so the row shows progress at a glance.
          animate={{ scale: digit ? 1.04 : 1 }}
          transition={{ duration: DUR.state, ease: EASE_OUT }}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onBlur={index === length - 1 ? onBlur : undefined}
          className={cn(
            "h-12 w-10 rounded-md border bg-background text-center text-base font-semibold",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            hasError
              ? "border-destructive focus:ring-destructive"
              : digit
                ? "border-primary/40"
                : "border-input",
            disabled && "cursor-not-allowed opacity-50",
          )}
        />
      ))}
    </motion.div>
  );
};

export default OtpBoxInput;
