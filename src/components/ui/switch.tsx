import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent bg-zinc-200 p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] data-[disabled]:pointer-events-none data-[disabled]:opacity-60 data-[checked]:bg-sky-500",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.24)] transition-transform duration-200 data-[checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  );
});

export const SwitchThumb = SwitchPrimitive.Thumb;
