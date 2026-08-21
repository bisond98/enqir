import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, AlertCircle, CheckCircle, XCircle, Info, Zap, Ban, Lock, CreditCard, Wallet } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex max-h-screen w-full flex-col items-center justify-center px-4 sm:bottom-0 sm:right-0 sm:left-auto sm:top-auto sm:translate-x-0 sm:flex-col sm:items-end sm:px-0 md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full max-w-[calc(100vw-2rem)] sm:max-w-[420px] items-center justify-between space-x-3 sm:space-x-4 overflow-hidden rounded-xl border-[0.5px] p-3.5 sm:p-4 pr-7 sm:pr-8 shadow-[0_8px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] transition-all duration-300 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none backdrop-blur-sm mx-auto",
  {
    variants: {
      variant: {
        default: "border-black bg-white text-black",
        destructive:
          "destructive group border-red-600 bg-red-600 text-white",
        success: "border-green-500 bg-green-50 text-green-900",
        warning: "border-yellow-500 bg-yellow-50 text-yellow-900",
        info: "border-blue-500 bg-blue-50 text-blue-900",
        cancelled: "border-red-900 bg-red-900 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, children, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        toastVariants({ variant }), 
        className,
        "[&[data-state=open]]:animate-[dynamicIslandEnter_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]",
        "[&[data-state=closed]]:animate-[dynamicIslandExit_0.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
      )}
      {...props}
    >
      {/* Physical button depth effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-xl pointer-events-none z-[1]" />
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl z-[1]" />
      {children}
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-gray-600 bg-gray-700 px-3 text-sm font-medium text-white ring-offset-background transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-red-300/40 group-[.destructive]:hover:border-red-600/30 group-[.destructive]:hover:bg-red-700 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 sm:right-3 top-2 sm:top-3 rounded-md p-1.5 sm:p-2 text-black hover:text-gray-700 opacity-100 transition-all focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 touch-manipulation z-20",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4 sm:h-5 sm:w-5" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-xs sm:text-sm font-semibold sm:font-bold leading-tight sm:leading-tight text-left break-words pr-2 sm:pr-0 self-center sm:self-start", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-[10px] sm:text-xs font-normal leading-relaxed sm:leading-relaxed mt-0.5 sm:mt-1 text-left break-words pr-2 sm:pr-0", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
