import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-input bg-card px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-foreground/40 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
