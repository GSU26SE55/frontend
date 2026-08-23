import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";

import { DIST, DUR, EASE_OUT } from "./tokens";

/**
 * Route-level enter/exit. `mode="wait"` so the outgoing page is gone before the next
 * one arrives — two pages crossfading on top of each other reads as a glitch, not a
 * transition. The page arrives from the left over DUR.layout — long enough to read as
 * deliberate rather than a flicker — and leaves on a short fade. Keyed by the caller
 * (always the pathname), and instant under reduced motion. No `initial={false}` on the
 * presence: arriving at a page — a full load, not just an in-app navigation — is the
 * moment this animation exists for.
 */
export function PageTransition({
  routeKey,
  from = "left",
  children,
  ...rest
}: HTMLMotionProps<"div"> & {
  routeKey: string;
  /**
   * Where the page comes from. "left" for in-app navigation — the content follows the
   * click across the nav. "bottom" for the shell's first paint, where everything rises
   * together and a sideways slide would fight the sidebar coming up beside it.
   */
  from?: "left" | "bottom";
}) {
  const reduced = useReducedMotion();
  const offset =
    from === "bottom" ? { y: DIST.md } : { x: -DIST.md };
  const away = from === "bottom" ? { y: -DIST.sm } : { x: DIST.sm };
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial={reduced ? false : { opacity: 0, ...offset }}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: DUR.layout, ease: EASE_OUT },
        }}
        exit={{
          opacity: 0,
          ...(reduced ? {} : away),
          transition: { duration: reduced ? 0 : DUR.state, ease: EASE_OUT },
        }}
        {...rest}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
