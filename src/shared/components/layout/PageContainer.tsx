import { cn } from "@/lib/utils";

/**
 * The frame every routed page sits in. One padding, one vertical rhythm, so the distance
 * from the sidebar to the content is identical on every screen and nothing shifts
 * sideways when you navigate.
 *
 * This used to be hand-written per page, which drifted: `max-w-360` on 39 pages but
 * `max-w-[1600px]`, `-350`, `-300` and `-275` elsewhere. Because the wrapper was
 * centred, a different max width meant a different left margin — so the content
 * appeared to jump between routes. Set the frame here, never at the page.
 *
 * There is no max width on the default size: this is an operations console, where the
 * tables carry many columns and the screen is the budget. The content starts a short
 * gutter from the sidebar and runs to the far edge, rather than floating in a centred
 * column with empty space either side.
 *
 * `size="narrow"` is the exception, for genuinely form-shaped pages (settings, a single
 * profile). A form stretched across 2000px leaves its fields stranded, so those stay in
 * a centred column.
 *
 * `fillViewport` is for the role dashboards (manager, staff): one fixed frame that fills
 * the viewport at any data volume, no page-level scroll on desktop. `space-y-6` becomes a
 * column flex so a `flex-1` child can claim the remaining height, and scrolling stays on
 * (via `overflow-y-auto`) below the `lg` breakpoint, where panels stack instead of filling
 * a frame.
 */
export function PageContainer({
  children,
  className,
  size = "default",
  fillViewport = false,
  ...rest
}: React.ComponentProps<"div"> & {
  /** "narrow" for form/settings pages. Anything list- or dashboard-shaped stays default. */
  size?: "default" | "narrow";
  /** One fixed frame filling the viewport, no desktop scroll. For fixed-frame dashboards only. */
  fillViewport?: boolean;
}) {
  return (
    <div
      data-slot="page-container"
      className={cn(
        // Gutters come from `--page-pl` / `--page-pr` (defined on :root in index.css), so
        // a child that needs to bleed to the page edge can cancel them with
        // `calc(var(--page-pl) * -1)` however deeply it is nested. `-mx-6` guessed, and
        // guessed wrong the moment the two gutters stopped matching.
        "w-full py-6 pl-(--page-pl) pr-(--page-pr)",
        fillViewport
          ? "flex h-full flex-col overflow-y-auto lg:overflow-hidden"
          : "space-y-6",
        // A centred column needs matching gutters, or it reads as misaligned.
        size === "narrow" && "mx-auto max-w-275 [--page-pl:var(--page-pr)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
