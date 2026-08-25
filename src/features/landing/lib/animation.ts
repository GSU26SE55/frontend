export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const createCleanupBag = () => {
  const fns: Array<() => void> = [];
  return {
    add(anim: { revert: () => void }) {
      fns.push(() => anim.revert());
    },
    flush() {
      fns.forEach((fn) => fn());
      fns.length = 0;
    },
  };
};

/**
 * The landing page's easing vocabulary, so anime.js motion sits on the same two curves
 * as the rest of the app rather than picking a different one per section. `outQuart`,
 * `outQuad`, `outExpo` and `outBack` were all in use at once — close enough to each
 * other to look accidental rather than intentional.
 *
 * Values match `--motion-ease-out` / `--motion-ease-in-out` in index.css.
 */
export const EASE = {
  /** Enters and exits — everything that arrives on screen. */
  out: "cubicBezier(0.23, 1, 0.32, 1)",
  /** On-screen movement — things travelling between two places. */
  inOut: "cubicBezier(0.77, 0, 0.175, 1)",
} as const;
