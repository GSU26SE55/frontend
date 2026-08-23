import * as React from "react";
import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";

import { cn } from "@/lib/utils";
import { DIST, DUR, EASE_OUT } from "@/shared/motion/tokens";

// Rows rise into place, one after the other, when a table mounts or its data
// swaps (page 2, a new filter). Ordering comes from framer's variant propagation —
// `TableBody` staggers whatever `TableRow` children it has, so no row needs its index.
// Cost is one motion component per row: fine for the paginated tables here, worth a
// second look if a table ever renders hundreds of rows unpaginated.
const ROW_VARIANTS = {
  hidden: { opacity: 0, y: DIST.md },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.layout, ease: EASE_OUT },
  },
};

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: HTMLMotionProps<"tbody">) {
  const reduced = useReducedMotion();
  return (
    <motion.tbody
      data-slot="table-body"
      initial={reduced ? false : "hidden"}
      animate="shown"
      variants={{ shown: { transition: { staggerChildren: 0.025 } } }}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

// Only rows inside `TableBody` animate: a variant child with no motion parent (a header
// or footer row) has nothing to inherit the "hidden"/"shown" labels from, so it renders
// as a plain row.
function TableRow({ className, ...props }: HTMLMotionProps<"tr">) {
  return (
    <motion.tr
      data-slot="table-row"
      variants={ROW_VARIANTS}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground first:pl-4 last:pr-4 has-[[role=checkbox]]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap first:pl-4 last:pr-4 has-[[role=checkbox]]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
