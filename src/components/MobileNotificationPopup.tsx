import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileNotificationPopupProps {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  actionUrl?: string;
  onDismiss: (id: string) => void;
  index: number;
}

export const MobileNotificationPopup: React.FC<MobileNotificationPopupProps> = ({
  id,
  title,
  message,
  type = 'info',
  actionUrl,
  onDismiss,
  index,
}) => {
  try {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
    const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Define handleDismiss before useEffect so it can be called
    const handleDismiss = useCallback(() => {
      try {
        setIsVisible(false);
        // Clear any existing dismiss timeout
        if (dismissTimeoutRef.current) {
          clearTimeout(dismissTimeoutRef.current);
        }
        // Use a timeout to allow animation to complete
        dismissTimeoutRef.current = setTimeout(() => {
          try {
            if (onDismiss && id) {
              onDismiss(id);
            }
          } catch (error) {
            console.error('Error in onDismiss callback:', error);
          }
        }, 300);
      } catch (error) {
        console.error('Error dismissing notification:', error);
      }
    }, [onDismiss, id]);

    useEffect(() => {
      try {
        // Slide in animation
        timerRef.current = setTimeout(() => {
          try {
            setIsVisible(true);
          } catch (error) {
            console.error('Error setting visibility:', error);
          }
        }, 100);
        
        // Auto dismiss after 6 seconds (increased from 5 for better UX)
        dismissTimerRef.current = setTimeout(() => {
          try {
            handleDismiss();
          } catch (error) {
            console.error('Error in auto dismiss:', error);
          }
        }, 6000);

        return () => {
          try {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
            if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
          } catch (error) {
            console.error('Error clearing timers:', error);
          }
        };
      } catch (error) {
        console.error('Error in popup effect:', error);
      }
    }, [id, handleDismiss]); // Include handleDismiss in dependencies

    const handleClick = () => {
      try {
        if (actionUrl) {
          navigate(actionUrl);
          handleDismiss();
        }
      } catch (error) {
        console.error('Failed to navigate:', error);
        handleDismiss();
      }
    };

    const getIcon = () => {
      try {
        switch (type) {
          case 'success':
            return <Check className="w-5 h-5 text-green-600" />;
          case 'error':
            return <AlertCircle className="w-5 h-5 text-red-600" />;
          case 'warning':
            return <AlertCircle className="w-5 h-5 text-yellow-600" />;
          default:
            return <Info className="w-5 h-5 text-blue-600" />;
        }
      } catch (error) {
        console.error('Error getting icon:', error);
        return <Info className="w-5 h-5 text-blue-600" />;
      }
    };

    const getBgColor = () => {
      try {
        switch (type) {
          case 'success':
            return 'bg-green-50 border-green-200';
          case 'error':
            return 'bg-red-50 border-red-200';
          case 'warning':
            return 'bg-yellow-50 border-yellow-200';
          default:
            return 'bg-blue-50 border-blue-200';
        }
      } catch (error) {
        console.error('Error getting bg color:', error);
        return 'bg-blue-50 border-blue-200';
      }
    };

    // Validate required props
    if (!id || !onDismiss) {
      return null;
    }

    try {
      return (
    <div
      className={`fixed left-4 right-4 z-[9999] transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
      style={{
        top: `${80 + index * 90}px`,
      }}
    >
      <div
        onClick={handleClick}
        className={`${getBgColor()} border rounded-lg shadow-lg p-4 cursor-pointer active:scale-95 transition-transform`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
              {title}
            </h4>
            <p className="text-xs text-gray-700 line-clamp-2">
              {message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900/20 rounded-full"
            style={{
              animation: 'shrink 6s linear forwards',
            }}
          />
        </div>
      </div>

        <style>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
      );
    } catch (error) {
      console.error('Error rendering popup:', error);
      return null;
    }
  } catch (error) {
    console.error('MobileNotificationPopup error:', error);
    return null;
  }
};

