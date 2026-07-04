import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages.js";

function DottedDialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dotted-dialog" {...props} />;
}

function DottedDialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return (
    <DialogPrimitive.Trigger data-slot="dotted-dialog-trigger" {...props} />
  );
}

function DottedDialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dotted-dialog-portal" {...props} />;
}

function DottedDialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dotted-dialog-close" {...props} />;
}

function DottedDialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dotted-dialog-overlay"
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 isolate z-50 overflow-hidden bg-background/75 backdrop-blur-sm duration-200",
        "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--foreground)_38%,transparent)_1px,transparent_1px)] before:bg-[length:18px_18px]",
        "after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_center,transparent_35%,var(--background)_92%)]",
        className,
      )}
      {...props}
    />
  );
}

function DottedDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
}) {
  return (
    <DottedDialogPortal>
      <DottedDialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dotted-dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-hidden border border-border/70 bg-fd-background text-xs/relaxed shadow-2xl shadow-black/20 outline-none duration-200 sm:max-w-sm",
          "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-closed:slide-out-to-top-[2%] data-open:slide-in-from-top-[2%]",
          "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--foreground)_20%,transparent)_1px,transparent_1px)] before:bg-[length:16px_16px]",
          className,
        )}
        {...props}
      >
        <div className="relative z-[1] grid min-h-0">{children}</div>
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dotted-dialog-close"
            className="absolute top-4 right-4 z-[2] flex h-7 w-7 items-center justify-center border border-transparent text-muted-foreground/60 transition-all duration-150 hover:border-border hover:bg-background/70 hover:text-foreground focus:outline-none"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">{m.uiClose()}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DottedDialogPortal>
  );
}

function DottedDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dotted-dialog-header"
      className={cn("flex flex-col gap-1.5 pr-8", className)}
      {...props}
    />
  );
}

function DottedDialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dotted-dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close className="inline-flex h-9 items-center justify-center border border-border/50 bg-muted/20 px-4 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted/40 hover:text-foreground">
          {m.uiClose()}
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DottedDialogTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dotted-dialog-title"
      className={cn("text-sm font-medium tracking-tight", className)}
      {...props}
    />
  );
}

function DottedDialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dotted-dialog-description"
      className={cn(
        "text-muted-foreground *:[a]:hover:text-foreground text-xs/relaxed *:[a]:underline *:[a]:underline-offset-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  DottedDialog as Dialog,
  DottedDialogClose as DialogClose,
  DottedDialogContent as DialogContent,
  DottedDialogDescription as DialogDescription,
  DottedDialogFooter as DialogFooter,
  DottedDialogHeader as DialogHeader,
  DottedDialogOverlay as DialogOverlay,
  DottedDialogPortal as DialogPortal,
  DottedDialogTitle as DialogTitle,
  DottedDialogTrigger as DialogTrigger,
};
