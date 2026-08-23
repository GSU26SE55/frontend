import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { SPRING } from "@/shared/motion/tokens";

function Switch({
  className,
  size = "default",
  checked,
  defaultChecked,
  onCheckedChange,
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default";
}) {
  const reduced = useReducedMotion();
  // Base UI keeps the checked state to itself, so mirror it — the thumb position is a
  // framer animation now, not a `data-checked:` class.
  const [uncontrolled, setUncontrolled] = React.useState(defaultChecked ?? false);
  const isChecked = checked ?? uncontrolled;
  // Thumb travel = its own width minus the 2px inset, in px, because framer cannot
  // interpolate between `0` and a `calc()`. Matches the Tailwind sizes below.
  const travel = size === "sm" ? 10 : 14;

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={(next, details) => {
        setUncontrolled(next);
        onCheckedChange?.(next, details);
      }}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-4.6 data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-background ring-0 group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground"
        render={
          <motion.span
            // `initial={false}` → mounts already at the right end, only user toggles
            // animate. Without it framer paints the thumb at x:0 until the first frame.
            initial={false}
            animate={{ x: isChecked ? travel : 0 }}
            transition={reduced ? { duration: 0 } : SPRING}
          />
        }
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
