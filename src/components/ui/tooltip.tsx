"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/utils";

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipCreateHandle = TooltipPrimitive.createHandle;

export const TooltipPopup = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Popup>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Popup> & {
    align?: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Positioner>["align"];
    side?: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Positioner>["side"];
    sideOffset?: number;
  }
>(function TooltipPopup({ align, className, side = "top", sideOffset = 6, ...props }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner align={align} side={side} sideOffset={sideOffset}>
        <TooltipPrimitive.Popup
          ref={ref}
          {...props}
          className={cn(
            "z-50 max-w-[280px] origin-[var(--transform-origin)] rounded-[calc(var(--radius)-8px)] border border-white/10 bg-zinc-950/96 px-3 py-2 text-[12px] font-medium leading-5 text-white shadow-[0_14px_34px_rgba(15,23,42,0.24)] backdrop-blur-sm transition-[opacity,transform] duration-150 ease-out data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0",
            className,
          )}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
});

export const TooltipContent = TooltipPopup;
