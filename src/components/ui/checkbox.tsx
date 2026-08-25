"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { SPRING } from "@/shared/motion/tokens";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  const reduced = useReducedMotion();
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-lg border border-input transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className,
      )}
      {...props}
    >
      {/* The indicator is unmounted while unchecked, so mounting is the tick: it pops
          in with the same spring the switch thumb uses. */}
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current [&>svg]:size-3.5"
        render={
          <motion.span
            initial={reduced ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: SPRING }}
          />
        }
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
