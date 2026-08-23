"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import {
  PopupPresence,
  PopupRoot,
  PopupSurface,
  usePopupRoot,
} from "@/shared/motion/popup";

function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: DialogPrimitive.Root.Props) {
  const popup = usePopupRoot(open, defaultOpen);
  return (
    <PopupRoot value={popup.value}>
      <DialogPrimitive.Root
        data-slot="dialog"
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

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      render={<PopupSurface variant="fade" />}
      className={cn("fixed inset-0 isolate z-50 bg-black/60", className)}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  overlayClassName,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  overlayClassName?: string;
}) {
  return (
    <DialogPortal keepMounted>
      {/* One presence for both parts: the backdrop and the panel must leave together,
          and the popup may only unmount once the slower of the two has finished. */}
      <PopupPresence>
        <DialogOverlay key="overlay" className={overlayClassName} />
        <DialogPrimitive.Popup
          key="popup"
        data-slot="dialog-content"
        render={<PopupSurface variant="dialog" />}
        style={{ translate: "-50% -50%" }}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] gap-5 rounded-2xl bg-card p-6 text-card-foreground border border-border/80 shadow-2xl shadow-black/20 outline-none sm:max-w-lg",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-4 right-4 rounded-full size-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                size="icon-sm"
              />
            }
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
        </DialogPrimitive.Popup>
      </PopupPresence>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 text-left pb-1", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-6 -mb-6 mt-2 flex flex-col-reverse gap-3 rounded-b-2xl border-t border-border/60 bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-lg lg:text-xl font-bold text-foreground leading-snug tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground leading-relaxed mt-0.5 *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
