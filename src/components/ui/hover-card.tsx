import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";

import { cn } from "@/lib/utils";
import {
  PopupPresence,
  PopupRoot,
  PopupSurface,
  usePopupRoot,
} from "@/shared/motion/popup";

function HoverCard({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: PreviewCardPrimitive.Root.Props) {
  const popup = usePopupRoot(open, defaultOpen);
  return (
    <PopupRoot value={popup.value}>
      <PreviewCardPrimitive.Root
        data-slot="hover-card"
        open={open}
        defaultOpen={defaultOpen}
        actionsRef={popup.actionsRef}
        onOpenChange={(next, details) => {
          popup.sync(next);
          onOpenChange?.(next, details);
        }}
        {...props}
      />
    </PopupRoot>
  );
}

function HoverCardTrigger({ ...props }: PreviewCardPrimitive.Trigger.Props) {
  return (
    <PreviewCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  );
}

function HoverCardContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PreviewCardPrimitive.Portal keepMounted>
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopupPresence>
          <PreviewCardPrimitive.Popup
            data-slot="hover-card-content"
            render={<PopupSurface variant="scale" side={side} />}
            className={cn(
              "z-50 w-72 rounded-lg bg-popover p-3 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden",
              className,
            )}
            {...props}
          />
        </PopupPresence>
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
