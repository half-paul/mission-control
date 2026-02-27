import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm",
          "placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-zinc-950 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-zinc-800 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
