// The motion system. Three durations, two travel distances, three curves, one spring.
// Anything not on this list is ad hoc — add it here first.
//
// These MIRROR the `--ease-*` / `--duration-*` custom properties in `index.css`.
// framer-motion cannot read CSS variables, so the values are duplicated rather than
// referenced — keep the two in sync. CSS-driven motion should use the CSS tokens
// (`ease-out-strong`, `duration-enter`, ...); JS-driven motion uses these.

/** Seconds, for framer-motion `transition.duration`. Mirrors `--duration-*`. */
export const DUR = {
  /** 120ms — hover, press, checkbox, toggle. */
  state: 0.12,
  /** 200ms — popover, toast, row expand. */
  enter: 0.2,
  /** 320ms — route change, table rows arriving, sheet. */
  layout: 0.32,
} as const;

/**
 * Travel distances in px — how far a thing flies in from. One dial for the whole app:
 * raise these and every entrance gets more dramatic, lower them and it calms down.
 */
export const DIST = {
  /** 8px — anchored surfaces, labels, small reveals. */
  sm: 8,
  /** 16px — modals, page content, table rows: anything that should read as "arriving". */
  md: 16,
} as const;

/** Enters and exits. Mirrors `--ease-out`. */
export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

/** On-screen movement — morphing, sliding between two places. Mirrors `--ease-in-out`. */
export const EASE_IN_OUT: [number, number, number, number] = [
  0.77, 0, 0.175, 1,
];

/** `layoutId` shared elements and toggles — nothing else gets a spring. */
export const SPRING = { type: "spring", stiffness: 400, damping: 32 } as const;
