import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={
        // `shimmer` (a travelling highlight) rather than `animate-pulse`: a whole block
        // fading in and out reads as "broken", a highlight sweeping across reads as "loading".
        cn("shimmer rounded-md bg-muted", className)
      }
      {...props}
    />
  );
}

export { Skeleton };
