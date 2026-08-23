// The motion system. Three durations, two travel distances, one curve, one spring.
// Anything not on this list is ad hoc — add it here first.

/** Seconds, for framer-motion `transition.duration`. */
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

/** Enters. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** `layoutId` shared elements and toggles — nothing else gets a spring. */
export const SPRING = { type: "spring", stiffness: 400, damping: 32 } as const;
