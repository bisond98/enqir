import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { buttonTap } from "@/lib/motion"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pal-blue/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer min-h-[44px]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-pal-blue to-blue-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 font-semibold",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95",
        outline:
          "border-2 border-pal-blue/30 bg-white hover:bg-gray-50 hover:border-pal-blue hover:shadow-md shadow-sm active:scale-95",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95",
        ghost: "hover:bg-gray-100 hover:shadow-sm active:scale-95",
        link: "text-pal-blue hover:text-pal-blue-dark underline-offset-4 hover:underline",
        hero: "bg-gradient-to-r from-pal-blue via-blue-600 to-pal-blue-dark text-white font-bold text-lg px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-1 active:scale-95 min-h-[56px]",
        card: "bg-white border-2 border-gray-200 hover:border-pal-blue/30 hover:shadow-xl hover:-translate-y-1 text-foreground active:scale-[0.99]",
        prominent: "bg-gradient-to-r from-pal-blue to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 active:scale-95 font-semibold",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-xl px-4 text-sm",
        lg: "h-12 rounded-2xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg font-semibold",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.button
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileTap={!props.disabled ? buttonTap : undefined}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
