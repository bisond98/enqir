import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VerificationBadgeProps {
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VerificationBadge = ({ 
  isVerified = false, 
  size = 'sm',
  className = '' 
}: VerificationBadgeProps) => {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <Badge 
      className={`bg-blue-100 text-blue-800 border-blue-200 ${textSizeClasses[size]} ${className}`}
    >
      <CheckCircle className={`${sizeClasses[size]} mr-1`} />
      Verified
    </Badge>
  );
};

export default VerificationBadge;

