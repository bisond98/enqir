import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedUserProps {
  name: string;
  isVerified?: boolean;
  className?: string;
  showVerification?: boolean;
}

export const VerifiedUser: React.FC<VerifiedUserProps> = ({ 
  name, 
  isVerified = false, 
  className = "",
  showVerification = true 
}) => {
  // Check if this is a large text (like dashboard welcome)
  const isLargeText = className.includes('text-2xl') || className.includes('text-3xl') || 
                      className.includes('text-4xl') || className.includes('text-5xl') || 
                      className.includes('text-6xl') || className.includes('text-7xl');
  
  return (
    <span className={cn("inline-flex items-center gap-1 sm:gap-2", className)}>
      <span>{name}</span>
      {isVerified && showVerification && (
        <div 
          className={cn(
            "flex-shrink-0 bg-blue-500 rounded-full flex items-center justify-center",
            isLargeText ? "h-5 w-5 sm:h-8 sm:w-8" : "h-2 w-2 sm:h-3 sm:w-3"
          )}
          title="Verified User"
        >
          <Check 
            className={cn(
              "text-white font-bold",
              isLargeText ? "h-3 w-3 sm:h-5 sm:w-5" : "h-1 w-1 sm:h-1.5 sm:w-1.5"
            )}
            strokeWidth={2.5}
          />
        </div>
      )}
    </span>
  );
};

export default VerifiedUser;
