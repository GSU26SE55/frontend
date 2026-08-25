import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { DUR, EASE_OUT } from "./tokens";

/**
 * Bridges a conditional render so the content does not teleport into (or out of) the
 * layout. (Named `RevealInline` to stay distinct from the landing page's scroll-driven
 * `Reveal`, which is a different thing entirely.) For the small, frequently-toggled affordances — a "Clear filters" button
 * appearing beside a filter row, an inline hint, a contextual action.
 *
 * Deliberately scale + opacity only: both are GPU-composited, so a control popping in
 * never costs layout on a page that may be rendering a large table at the same time.
 * Under reduced motion the transform is dropped and only the fade remains.
 */
export function RevealInline({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: DUR.enter, ease: EASE_OUT },
          }}
          exit={{
            opacity: 0,
            ...(reduced ? {} : { scale: 0.96 }),
            transition: { duration: DUR.state, ease: EASE_OUT },
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
