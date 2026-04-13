import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";

import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;

export const SelectValue = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>
>(function SelectValue({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Value
      ref={ref}
      className={cn("min-w-0 truncate", className)}
      {...props}
    />
  );
});

const selectTriggerSizes = {
  default: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-4 py-3 text-sm",
  sm: "min-h-10 px-3 py-2 text-sm",
} as const;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: keyof typeof selectTriggerSizes;
  }
>(function SelectTrigger({ children, className, size = "default", ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "group relative inline-flex w-full items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[color:var(--border-strong)] bg-[color:var(--input)] text-left text-[color:var(--foreground)] shadow-[0_1px_0_rgba(255,255,255,0.85)] outline-none transition hover:bg-[color:var(--accent)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] data-[popup-open]:bg-[color:var(--accent)] disabled:pointer-events-none disabled:opacity-64",
        selectTriggerSizes[size],
        className,
      )}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronDown
        className="size-4 shrink-0 text-zinc-500 transition-transform duration-150 group-data-[popup-open]:rotate-180"
        aria-hidden="true"
        strokeWidth={1.6}
      />
    </SelectPrimitive.Trigger>
  );
});

export const SelectPopup = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Popup>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Popup> & {
    align?: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Positioner>["align"];
    alignItemWithTrigger?: boolean;
    side?: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Positioner>["side"];
    sideOffset?: number;
  }
>(function SelectPopup(
  {
    align = "start",
    alignItemWithTrigger = true,
    children,
    className,
    side = "bottom",
    sideOffset = 8,
    ...props
  },
  ref,
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
        side={side}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          ref={ref}
          className={cn(
            "z-50 max-h-80 min-w-[var(--anchor-width)] overflow-y-auto rounded-[var(--radius)] border border-[color:var(--border-strong)] bg-[color:var(--popover)] p-2 text-[color:var(--popover-foreground)] shadow-[0_18px_40px_rgba(15,23,42,0.14),0_4px_12px_rgba(15,23,42,0.08)] outline-none",
            className,
          )}
          {...props}
        >
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
});

export const SelectContent = SelectPopup;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ children, className, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "flex w-full items-center gap-3 rounded-[var(--radius-control-sm)] px-3 py-2.5 text-left text-sm text-zinc-900 outline-none transition data-[highlighted]:bg-[color:var(--accent)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      <SelectPrimitive.ItemIndicator className="inline-flex size-4 shrink-0 items-center justify-center text-zinc-900">
        <Check className="size-4" aria-hidden="true" strokeWidth={1.8} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
});

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn(
        "px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500",
        className,
      )}
      {...props}
    />
  );
});

export const SelectGroupLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.GroupLabel>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.GroupLabel>
>(function SelectGroupLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.GroupLabel
      ref={ref}
      className={cn(
        "px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500",
        className,
      )}
      {...props}
    />
  );
});
