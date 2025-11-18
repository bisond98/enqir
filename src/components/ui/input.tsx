import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-[12px] border border-borderLight bg-white pl-4 pr-4 py-3 text-base text-text-primary ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary placeholder:text-text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borderLight focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-borderLight font-sans",
          className
        )}
        style={{ fontSize: '16px', ...props.style }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
