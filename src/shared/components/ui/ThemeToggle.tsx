import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { DUR, EASE_OUT, SPRING } from "@/shared/motion/tokens";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const isDark = mounted && resolvedTheme === "dark";
  const reduced = useReducedMotion();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-border bg-muted p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {/* Knob travels 24px — the track is w-14 with p-1 and a size-6 knob. Spring rather
          than a linear slide, so the switch feels like it snaps into place. */}
      <motion.span
        className="absolute left-1 top-1 flex size-6 items-center justify-center overflow-hidden rounded-full bg-background text-foreground shadow-sm"
        initial={false}
        animate={{ x: isDark ? 24 : 0 }}
        transition={reduced ? { duration: 0 } : SPRING}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={reduced ? false : { opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1, transition: SPRING }}
            exit={{
              opacity: 0,
              rotate: 90,
              scale: 0.5,
              transition: { duration: DUR.state, ease: EASE_OUT },
            }}
          >
            {isDark ? (
              <Moon className="size-3.5" />
            ) : (
              <Sun className="size-3.5" />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
