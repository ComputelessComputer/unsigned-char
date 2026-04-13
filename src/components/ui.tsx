import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva } from "class-variance-authority";
import {
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export { Button, type ButtonProps } from "./ui/button";
export { cn };
export {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldItem,
  FieldLabel,
  FieldPrimitive,
  FieldValidity,
} from "./ui/field";
export { Input, InputPrimitive, type InputProps } from "./ui/input";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectLabel,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
export { Switch, SwitchThumb } from "./ui/switch";
export {
  Tooltip,
  TooltipContent,
  TooltipCreateHandle,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

type BadgeVariant =
  | "default"
  | "error"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "destructive"
  | "info";

type BadgeSize = "default" | "sm" | "lg";

const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm border border-transparent font-medium outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-3.5 sm:[&_svg:not([class*='size-'])]:size-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [button&,a&]:cursor-pointer [button&,a&]:pointer-coarse:after:absolute [button&,a&]:pointer-coarse:after:size-full [button&,a&]:pointer-coarse:after:min-h-11 [button&,a&]:pointer-coarse:after:min-w-11",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default:
          "h-5.5 min-w-5.5 px-[calc(--spacing(1)-1px)] text-sm sm:h-4.5 sm:min-w-4.5 sm:text-xs",
        lg: "h-6.5 min-w-6.5 px-[calc(--spacing(1.5)-1px)] text-base sm:h-5.5 sm:min-w-5.5 sm:text-sm",
        sm: "h-5 min-w-5 rounded-[.25rem] px-[calc(--spacing(1)-1px)] text-xs sm:h-4 sm:min-w-4 sm:text-[.625rem]",
      } satisfies Record<BadgeSize, string>,
      variant: {
        default: "bg-primary text-primary-foreground [button&,a&]:hover:bg-primary/90",
        destructive: "bg-destructive text-white [button&,a&]:hover:bg-destructive/90",
        error: "bg-destructive/8 text-destructive-foreground dark:bg-destructive/16",
        info: "bg-info/8 text-info-foreground dark:bg-info/16",
        outline:
          "border-input bg-background text-foreground dark:bg-input/32 [button&,a&]:hover:bg-accent/50 dark:[button&,a&]:hover:bg-input/48",
        secondary: "bg-secondary text-secondary-foreground [button&,a&]:hover:bg-secondary/90",
        success: "bg-success/8 text-success-foreground dark:bg-success/16",
        warning: "bg-warning/8 text-warning-foreground dark:bg-warning/16",
      } satisfies Record<BadgeVariant, string>,
    },
  },
);

export function Badge({
  className,
  children,
  render,
  variant = "default",
  size = "default",
  ...props
}: useRender.ComponentProps<"span"> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
}): ReactElement {
  const defaultProps = {
    children,
    className: cn(badgeVariants({ className, size, variant })),
    "data-slot": "badge",
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    render,
  });
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "overflow-hidden rounded-[calc(var(--radius)+2px)] border border-[color:var(--border-strong)] bg-[color:var(--card)] text-[color:var(--card-foreground)] shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_40px_rgba(15,23,42,0.06)]",
        className,
      )}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("flex flex-col gap-2 px-5 pt-5", className)} />;
}

export function CardAction({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("flex shrink-0 items-center gap-2", className)} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      {...props}
      className={cn(
        "text-lg font-semibold tracking-[-0.03em] text-[color:var(--card-foreground)]",
        className,
      )}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      {...props}
      className={cn("text-sm leading-6 text-[color:var(--muted-foreground)]", className)}
    />
  );
}

export function CardPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("px-5 py-5", className)} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-wrap items-center gap-3 border-t border-[color:var(--border)] px-5 py-4",
        className,
      )}
    />
  );
}

export function Kbd({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  children: ReactNode;
}) {
  return (
    <kbd
      {...props}
      className={cn(
        "inline-flex min-h-6 items-center rounded-md border border-[color:var(--border-strong)] bg-[color:var(--secondary)] px-1.5 text-[11px] font-medium text-[color:var(--muted-foreground)] shadow-[0_1px_0_rgba(255,255,255,0.9)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

type ScrollFadeTone = "background" | "card";

const scrollFadeTones = {
  background: "from-[color:var(--background)]",
  card: "from-[color:var(--card)]",
} satisfies Record<ScrollFadeTone, string>;

export function ScrollFade({
  className,
  showBottom,
  showTop,
  tone = "background",
}: {
  className?: string;
  showBottom: boolean;
  showTop: boolean;
  tone?: ScrollFadeTone;
}) {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b to-transparent transition-opacity duration-150",
          scrollFadeTones[tone],
          showTop ? "opacity-100" : "opacity-0",
          className,
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t to-transparent transition-opacity duration-150",
          scrollFadeTones[tone],
          showBottom ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </>
  );
}
