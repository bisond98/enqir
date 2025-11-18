import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-[12px] border border-borderLight bg-white pl-4 pr-4 py-3 text-base text-text-primary ring-offset-background placeholder:text-text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borderLight focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-borderLight resize-none font-sans",
          className
        )}
        style={{ fontSize: '16px', ...props.style }}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
