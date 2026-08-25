import { Inbox, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { DIST, DUR, EASE_OUT } from "@/shared/motion/tokens";

interface EmptyStateProps {
  /** Illustration icon. Defaults to Inbox. */
  icon?: LucideIcon;
  /** Main line. Default: no data yet. */
  title?: string;
  /** Secondary description (optional). */
  description?: string;
  /** CTA (e.g. "Clear filters" / "Create new"). Omit → hides the button. */
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Shared empty state — icon + text + optional CTA.
 * Unifies the ad-hoc "No… / Not yet…" strings written inline on every page.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = "No data yet",
  description,
  action,
  className,
}: EmptyStateProps) {
  const reduced = useReducedMotion();

  // An empty state is a small disappointment — the one place in a dense dashboard where
  // a beat of stagger is affordable. Decorative only: the CTA is clickable throughout.
  const item = {
    hidden: { opacity: 0, y: DIST.sm },
    shown: {
      opacity: 1,
      y: 0,
      transition: { duration: DUR.enter, ease: EASE_OUT },
    },
  };

  return (
    <motion.div
      initial={reduced ? false : "hidden"}
      animate="shown"
      variants={{ shown: { transition: { staggerChildren: 0.05 } } }}
      className={`flex flex-col items-center justify-center gap-2 py-12 text-center ${className ?? ""}`}
    >
      <motion.div variants={item}>
        <Icon className="size-8 text-muted-foreground/40" />
      </motion.div>
      <motion.p variants={item} className="text-sm font-medium text-foreground">
        {title}
      </motion.p>
      {description && (
        <motion.p
          variants={item}
          className="text-xs text-muted-foreground max-w-sm"
        >
          {description}
        </motion.p>
      )}
      {action && (
        <motion.div variants={item}>
          <Button
            variant="outline"
            size="sm"
            className="mt-1"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
