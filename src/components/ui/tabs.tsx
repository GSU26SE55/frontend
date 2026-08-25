import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";
import { DIST, DUR, EASE_OUT, SPRING } from "@/shared/motion/tokens";

// The active marker is one shared element that flies between tabs (`layoutId`) rather
// than a background that fades in on each trigger. `layoutId` is global, so it is scoped
// per list — two tab bars on one page would otherwise animate into each other.
const TabsListContext = React.createContext<{
  id: string;
  variant: "default" | "line";
} | null>(null);

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  const id = React.useId();
  const context = React.useMemo(
    () => ({ id, variant: variant ?? "default" }),
    [id, variant],
  );
  return (
    <TabsListContext.Provider value={context}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
      />
    </TabsListContext.Provider>
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  const context = React.useContext(TabsListContext);
  const reduced = useReducedMotion();

  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-colors group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground data-active:text-foreground dark:data-active:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      render={(renderProps, state) => {
        const { children, ...rest } = renderProps;
        return (
          <button {...rest}>
            {state.active && (
              <motion.span
                aria-hidden
                {...(reduced
                  ? {}
                  : {
                      layoutId: `${context?.id ?? "tabs"}-active`,
                      transition: SPRING,
                    })}
                className={
                  context?.variant === "line"
                    ? "absolute bg-foreground group-data-horizontal/tabs:inset-x-0 group-data-horizontal/tabs:bottom-[-5px] group-data-horizontal/tabs:h-0.5 group-data-vertical/tabs:inset-y-0 group-data-vertical/tabs:-right-1 group-data-vertical/tabs:w-0.5"
                    : "absolute inset-0 rounded-md bg-background shadow-sm dark:border dark:border-input dark:bg-input/30"
                }
              />
            )}
            <span className="relative inline-flex items-center justify-center gap-1.5">
              {children}
            </span>
          </button>
        );
      }}
      {...props}
    />
  );
}

// Which way the new panel flies in from: the direction you travelled. Going right along
// the tab bar pushes the panel in from the right, so the content follows the click.
const FROM_DIRECTION: Record<string, { x?: number; y?: number }> = {
  right: { x: DIST.md },
  left: { x: -DIST.md },
  down: { y: DIST.md },
  up: { y: -DIST.md },
  none: { y: DIST.sm },
};

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  const reduced = useReducedMotion();
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      // Inactive panels unmount, so mounting is the tab change: the panel arrives as the
      // marker slides. `render` keeps this to one element — an extra wrapper div would
      // break layouts that rely on the panel being the direct parent.
      render={(panelProps, state) => (
        <motion.div
          // Base UI hands over plain DOM props; the cast is only for framer's own
          // overloaded animation handlers, which Base UI never sets on a panel.
          {...(panelProps as HTMLMotionProps<"div">)}
          initial={
            reduced
              ? false
              : {
                  opacity: 0,
                  ...(FROM_DIRECTION[state.tabActivationDirection] ??
                    FROM_DIRECTION.none),
                }
          }
          animate={{
            opacity: 1,
            x: 0,
            y: 0,
            transition: { duration: DUR.enter, ease: EASE_OUT },
          }}
        />
      )}
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
