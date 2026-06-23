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
