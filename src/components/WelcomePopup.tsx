import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface WelcomePopupProps {
  isVisible: boolean;
  userName?: string;
  onClose: () => void;
}

export const WelcomePopup = ({ isVisible, userName, onClose }: WelcomePopupProps) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onClose();
        }, 200);
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div 
        className={`max-w-[280px] w-[90%] transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0 translate-y-1' : 'scale-100 opacity-100 translate-y-0'
        } bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden`}
        onClick={(e) => {
          e.stopPropagation();
          setIsClosing(true);
          setTimeout(() => onClose(), 200);
        }}
      >
        <div className="p-3 sm:p-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-black rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}!
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-600">
                Successfully signed in
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
