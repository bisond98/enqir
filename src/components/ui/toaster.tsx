import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { AlertCircle, CheckCircle, XCircle, Info, Zap, Ban, Lock, CreditCard, Wallet, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Icon mapping based on variant and content
const getToastIcon = (variant?: string, title?: React.ReactNode) => {
  const titleStr = typeof title === 'string' ? title.toLowerCase() : ''
  
  if (variant === 'success' || titleStr.includes('success') || titleStr.includes('🎉')) {
    return <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 animate-in fade-in zoom-in duration-300" />
  }
  
  if (variant === 'destructive' || titleStr.includes('failed') || titleStr.includes('error') || titleStr.includes('❌')) {
    if (titleStr.includes('payment') || titleStr.includes('razorpay')) {
      return <CreditCard className="h-5 w-5 text-red-600 flex-shrink-0 animate-in fade-in zoom-in duration-300" />
    }
    if (titleStr.includes('password') || titleStr.includes('wrong') || titleStr.includes('incorrect')) {
      return <Lock className="h-5 w-5 text-red-600 flex-shrink-0 animate-in fade-in zoom-in duration-300" />
    }
    if (titleStr.includes('cancelled') || titleStr.includes('cancel')) {
      return <Ban className="h-5 w-5 text-red-600 flex-shrink-0 animate-in fade-in zoom-in duration-300" />
    }
    return <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 animate-in fade-in zoom-in duration-300" />
  }
  
  if (variant === 'warning') {
    return <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 animate-in fade-in zoom-in duration-300" />
  }
  
  if (variant === 'info') {
    return <Info className="h-5 w-5 text-blue-600 flex-shrink-0 animate-in fade-in zoom-in duration-300" />
  }
  
  return null
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(function ({ id, title, description, action, variant, duration, ...props }) {
        const icon = getToastIcon(variant, title)
        const titleStr = typeof title === 'string' ? title.toLowerCase() : ''
        const isPaymentCancelled = titleStr.includes('payment cancelled') || titleStr.includes('cancelled 🚫')
        
        // Use cancelled variant for payment cancelled toasts
        const toastVariant = isPaymentCancelled ? 'cancelled' : variant
        
        const toastDuration = duration !== undefined && duration !== null ? duration : 5000;
        return (
          <Toast 
            key={id} 
            variant={toastVariant as any} 
            className={isPaymentCancelled ? 'payment-cancelled-toast' : ''}
            duration={toastDuration}
            {...props}
          >
            {/* Futuristic AI Cloud Animation Background - Red Theme */}
            {isPaymentCancelled && (
              <>
                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                  {/* Animated cloud particles - Red theme */}
                  <div className="absolute top-0 left-0 w-full h-full opacity-40">
                    <div className="absolute top-0 left-[10%] w-1.5 h-1.5 bg-white rounded-full animate-[particleFloat_3s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}></div>
                    <div className="absolute top-0 left-[30%] w-1 h-1 bg-white rounded-full animate-[particleFloat_4s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute top-0 left-[50%] w-2 h-2 bg-white rounded-full animate-[particleFloat_3.5s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-0 left-[70%] w-1 h-1 bg-white rounded-full animate-[particleFloat_4.5s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }}></div>
                    <div className="absolute top-0 left-[90%] w-1.5 h-1.5 bg-white rounded-full animate-[particleFloat_3.2s_ease-in-out_infinite]" style={{ animationDelay: '2s' }}></div>
                  </div>
                  
                  {/* Shimmer wave effect - Red theme */}
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmerWave 3s ease-in-out infinite',
                    }}
                  ></div>
                  
                  {/* Glow effect - Maroon theme */}
                  <div 
                    className="absolute inset-0 rounded-xl"
                    style={{
                      boxShadow: '0 0 20px rgba(127, 29, 29, 0.5), 0 0 40px rgba(127, 29, 29, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                      animation: 'aiGlowPulse 2s ease-in-out infinite',
                    }}
                  ></div>
                </div>
              </>
            )}
            
            <div className={`flex items-start gap-2 sm:gap-2.5 flex-1 relative z-10 ${isPaymentCancelled ? 'animate-[cloudFloat_0.8s_ease-out_forwards]' : ''}`}>
              {icon && (
                <div className="flex-shrink-0 mt-0.5">
                  {isPaymentCancelled ? (
                    <div className="relative">
                      <Ban className="h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0 animate-in fade-in zoom-in duration-300" />
                      <div className="absolute inset-0 bg-white rounded-full blur-sm opacity-40 animate-pulse"></div>
                    </div>
                  ) : (
                    icon
                  )}
                </div>
              )}
              <div className="grid gap-0.5 flex-1 min-w-0">
                {title && (
                  <ToastTitle className={isPaymentCancelled ? 'text-white font-bold text-xs sm:text-sm leading-tight' : ''}>
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className={isPaymentCancelled ? 'text-white/90 font-medium text-[10px] sm:text-xs leading-tight whitespace-nowrap overflow-hidden text-ellipsis' : ''}>
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
