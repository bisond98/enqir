import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Zap } from 'lucide-react';
import { format, isAfter, isBefore, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';

interface CountdownTimerProps {
  deadline: Date | any; // Allow Firestore timestamps and other date formats
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'urgent' | 'critical';
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  deadline,
  className = "",
  showIcon = true,
  variant = 'default'
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      
      // Convert deadline to Date object if it's not already
      let deadlineDate: Date;
      if (deadline instanceof Date) {
        deadlineDate = deadline;
      } else if (deadline && typeof deadline.toDate === 'function') {
        // Firestore timestamp
        deadlineDate = deadline.toDate();
      } else if (deadline && typeof deadline.getTime === 'function') {
        // Already a Date-like object
        deadlineDate = deadline;
      } else if (typeof deadline === 'string' || typeof deadline === 'number') {
        // String or timestamp
        deadlineDate = new Date(deadline);
      } else {
        // Invalid deadline, return expired state
        setIsExpired(true);
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0
        };
      }
      
      const diff = deadlineDate.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0
        };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return {
        days,
        hours,
        minutes,
        seconds,
        total: diff
      };
    };

    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft());
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const getUrgencyLevel = () => {
    if (isExpired) return 'expired';
    
    const totalHours = timeLeft.total / (1000 * 60 * 60);
    
    if (totalHours < 1) return 'critical';
    if (totalHours < 6) return 'urgent';
    if (totalHours < 24) return 'high';
    if (totalHours < 72) return 'medium';
    return 'low';
  };

  const getVariantStyles = (level: string) => {
    switch (level) {
      case 'expired':
        return {
          bg: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertTriangle className="h-3 w-3" />,
          text: 'Expired'
        };
      case 'critical':
        return {
          bg: 'bg-red-100 text-red-800 border-red-200',
          icon: <Zap className="h-3 w-3" />,
          text: 'Critical'
        };
      case 'urgent':
        return {
          bg: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <Zap className="h-3 w-3" />,
          text: 'Urgent'
        };
      case 'high':
        return {
          bg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="h-3 w-3" />,
          text: 'High'
        };
      case 'medium':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Clock className="h-3 w-3" />,
          text: 'Medium'
        };
      default:
        return {
          bg: 'bg-green-100 text-green-800 border-green-200',
          icon: <Clock className="h-3 w-3" />,
          text: 'Low'
        };
    }
  };

  const formatTimeLeft = () => {
    if (isExpired) {
      return 'Expired';
    }

    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.seconds}s`;
    }
  };

  const urgencyLevel = getUrgencyLevel();
  const styles = getVariantStyles(urgencyLevel);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showIcon && (
        <div className="flex items-center">
          {styles.icon}
        </div>
      )}
      <Badge 
        variant="outline" 
        className={`${styles.bg} text-xs font-medium px-2 py-1 ${
          urgencyLevel === 'critical' || urgencyLevel === 'urgent' ? 'animate-pulse' : ''
        }`}
      >
        {formatTimeLeft()}
      </Badge>
    </div>
  );
};

export default CountdownTimer;

