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
 */
export function PageContainer({
  children,
  className,
  size = "default",
  ...rest
}: React.ComponentProps<"div"> & {
  /** "narrow" for form/settings pages. Anything list- or dashboard-shaped stays default. */
  size?: "default" | "narrow";
}) {
  return (
    <div
      data-slot="page-container"
      className={cn(
        // Gutters come from `--page-pl` / `--page-pr` (defined on :root in index.css), so
        // a child that needs to bleed to the page edge can cancel them with
        // `calc(var(--page-pl) * -1)` however deeply it is nested. `-mx-6` guessed, and
        // guessed wrong the moment the two gutters stopped matching.
        "w-full space-y-6 py-6 pl-(--page-pl) pr-(--page-pr)",
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
