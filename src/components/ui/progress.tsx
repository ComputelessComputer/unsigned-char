"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "@/lib/utils";

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(function Progress({ children, className, ...props }, ref) {
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("flex w-full flex-col gap-3", className)}
      data-slot="progress"
      {...props}
    >
      {children ?? (
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      )}
    </ProgressPrimitive.Root>
  );
});

export const ProgressTrack = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Track>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Track>
>(function ProgressTrack({ className, ...props }, ref) {
  return (
    <ProgressPrimitive.Track
      ref={ref}
      className={cn("h-2 overflow-hidden rounded-full bg-zinc-200", className)}
      data-slot="progress-track"
      {...props}
    />
  );
});

export const ProgressIndicator = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Indicator>
>(function ProgressIndicator({ className, ...props }, ref) {
  return (
    <ProgressPrimitive.Indicator
      ref={ref}
      className={cn(
        "h-full rounded-full bg-zinc-950 transition-[width] duration-500 ease-out data-[indeterminate]:w-1/3 data-[indeterminate]:animate-pulse",
        className,
      )}
      data-slot="progress-indicator"
      {...props}
    />
  );
});

export const ProgressLabel = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Label>
>(function ProgressLabel({ className, ...props }, ref) {
  return (
    <ProgressPrimitive.Label
      ref={ref}
      className={cn("text-sm font-medium text-zinc-900", className)}
      data-slot="progress-label"
      {...props}
    />
  );
});

export const ProgressValue = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Value>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Value>
>(function ProgressValue({ className, ...props }, ref) {
  return (
    <ProgressPrimitive.Value
      ref={ref}
      className={cn("text-sm text-zinc-500", className)}
      data-slot="progress-value"
      {...props}
    />
  );
});
