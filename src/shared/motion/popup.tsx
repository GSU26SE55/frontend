import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";

import { DIST, DUR, EASE_OUT } from "./tokens";

// Base UI unmounts a popup the instant it closes, which kills any JS exit animation.
// The documented hand-off is `keepMounted` on the portal plus `actionsRef.unmount()`
// once the animation is done — this module packages that so every overlay primitive
// (dialog, sheet, popover, menu, select, tooltip) animates the same way.

export type PopupActions = { unmount: () => void; close: () => void };

type PopupCtx = {
  open: boolean;
  actionsRef: React.RefObject<PopupActions | null>;
};

const Ctx = React.createContext<PopupCtx | null>(null);

/**
 * Root-side plumbing. Mirrors the open state (Base UI does not expose it) and owns
 * the imperative unmount handle. Spread the result onto the primitive's Root.
 */
// The hook and the components are one unit; splitting them across files just to satisfy
// fast refresh costs more than the reload it saves.
// eslint-disable-next-line react-refresh/only-export-components
export function usePopupRoot(openProp?: boolean, defaultOpen?: boolean) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen ?? false);
  const actionsRef = React.useRef<PopupActions | null>(null);
  const open = openProp ?? uncontrolled;
  const value = React.useMemo<PopupCtx>(
    () => ({ open, actionsRef }),
    [open],
  );
  return { value, actionsRef, sync: setUncontrolled };
}

export function PopupRoot({
  value,
  children,
}: {
  value: PopupCtx;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Keeps the popup mounted for the length of its exit animation. */
export function PopupPresence({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(Ctx);
  // No provider (a primitive not yet migrated) → render as-is rather than nothing.
  if (!ctx) return <>{children}</>;
  return (
    <AnimatePresence onExitComplete={() => ctx.actionsRef.current?.unmount()}>
      {ctx.open ? children : null}
    </AnimatePresence>
  );
}

const fast = { duration: DUR.state, ease: EASE_OUT };
const enter = { duration: DUR.enter, ease: EASE_OUT };
const layout = { duration: DUR.layout, ease: EASE_OUT };

const VARIANTS = {
  /** Anchored surfaces: menus, popovers, selects, tooltips. */
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1, x: 0, y: 0, transition: enter },
    exit: { opacity: 0, scale: 0.96, transition: fast },
  },
  /** Centered modals. */
  dialog: {
    initial: { opacity: 0, scale: 0.96, y: DIST.md },
    animate: { opacity: 1, scale: 1, y: 0, transition: enter },
    exit: { opacity: 0, scale: 0.98, y: DIST.sm, transition: fast },
  },
  /** Backdrops. */
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: enter },
    exit: { opacity: 0, transition: fast },
  },
  left: {
    initial: { x: "-100%" },
    animate: { x: 0, transition: layout },
    exit: { x: "-100%", transition: enter },
  },
  right: {
    initial: { x: "100%" },
    animate: { x: 0, transition: layout },
    exit: { x: "100%", transition: enter },
  },
  top: {
    initial: { y: "-100%" },
    animate: { y: 0, transition: layout },
    exit: { y: "-100%", transition: enter },
  },
  bottom: {
    initial: { y: "100%" },
    animate: { y: 0, transition: layout },
    exit: { y: "100%", transition: enter },
  },
} as const;

export type PopupVariant = keyof typeof VARIANTS;

// Anchored surfaces fly out of their trigger: a menu on the bottom drops down, a tooltip
// on the right slides right. Base UI resolves the real side after collision handling, so
// this is the requested side — close enough, and wrong only when a popup gets flipped.
const FROM_SIDE: Record<string, { x?: number; y?: number }> = {
  top: { y: DIST.sm },
  bottom: { y: -DIST.sm },
  left: { x: DIST.sm },
  right: { x: -DIST.sm },
  "inline-start": { x: DIST.sm },
  "inline-end": { x: -DIST.sm },
};

/**
 * The animated element itself. Pass through a Base UI `render` prop:
 * `<Popup render={<PopupSurface variant="scale" />} />`.
 */
export const PopupSurface = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & { variant?: PopupVariant; side?: string }
>(function PopupSurface({ variant = "scale", side, style, ...rest }, ref) {
  const reduced = useReducedMotion();
  const v = VARIANTS[variant];
  const initial =
    variant === "scale" && side
      ? { ...v.initial, ...FROM_SIDE[side] }
      : v.initial;
  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : initial}
      animate={v.animate}
      exit={reduced ? { opacity: 0, transition: fast } : v.exit}
      style={{ transformOrigin: "var(--transform-origin)", ...style }}
      {...rest}
    />
  );
});
