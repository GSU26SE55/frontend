import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";

import { DUR, EASE_OUT } from "./tokens";

/**
 * Route-level enter/exit. `mode="wait"` so the outgoing page is gone before the next
 * one arrives — two pages crossfading on top of each other reads as a glitch, not a
 * transition.
 *
 * A crossfade only, with no travel. Sidebar navigation is a "hundreds of times a day"
 * action, and sliding the page in from the side made every route change look like the
 * content was shifting relative to the sidebar — especially where two pages disagreed
 * about their own max-width. The fade is short enough to bridge the swap without ever
 * putting the layout somewhere it will not stay.
 */
export function PageTransition({
  routeKey,
  children,
  ...rest
}: HTMLMotionProps<"div"> & {
  routeKey: string;
}) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial={reduced ? false : { opacity: 0 }}
        animate={{
          opacity: 1,
          transition: { duration: DUR.enter, ease: EASE_OUT },
        }}
        exit={{
          opacity: 0,
          transition: { duration: reduced ? 0 : DUR.state, ease: EASE_OUT },
        }}
        {...rest}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
