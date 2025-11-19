import React, { useState } from 'react';
import { Mic, MicOff, ChevronDown, ChevronUp, Info, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { detectBrowser, getBrowserInstructions, requestMicrophonePermission, MicrophonePermissionStatus } from '@/utils/permissions';
import { toast } from '@/hooks/use-toast';

interface MicrophonePermissionPromptProps {
  permissionStatus: MicrophonePermissionStatus;
  onPermissionGranted?: () => void;
  className?: string;
}

const MicrophonePermissionPrompt: React.FC<MicrophonePermissionPromptProps> = ({
  permissionStatus,
  onPermissionGranted,
  className = ''
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const browser = detectBrowser();
  const instructions = getBrowserInstructions(browser);

  // Don't show if permission is granted
  if (permissionStatus === 'granted') {
    return null;
  }

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await requestMicrophonePermission();
      
      if (result === 'granted') {
        toast({
          title: 'Microphone Permission Granted',
          description: 'You can now make calls and send voice messages.',
        });
        onPermissionGranted?.();
      } else if (result === 'denied') {
        toast({
          title: 'Permission Denied',
          description: 'Please enable microphone access in your browser settings to use call and voice features.',
          variant: 'destructive'
        });
        setShowInstructions(true);
      } else {
        toast({
          title: 'Permission Request Failed',
          description: 'Please try again or enable microphone access manually in browser settings.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to request microphone permission. Please enable it manually in browser settings.',
        variant: 'destructive'
      });
      setShowInstructions(true);
    } finally {
      setIsRequesting(false);
    }
  };

  // Check if it's being used in a dialog (transparent background indicates dialog usage)
  const isInDialog = className.includes('bg-transparent');
  
  return (
    <div className={`w-full ${className}`}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/50 shadow-xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative p-4 sm:p-6">
          {/* Header Section - Creative Design */}
          <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
            {/* Animated Icon Container */}
            <div className={`relative mb-3 sm:mb-4 ${permissionStatus === 'denied' ? 'animate-shake' : 'animate-bounce'}`}>
              <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl animate-pulse"></div>
              <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center ${
                permissionStatus === 'denied' 
                  ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50'
              }`}>
                {permissionStatus === 'denied' ? (
                  <MicOff className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                ) : (
                  <Mic className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                )}
              </div>
              {permissionStatus !== 'denied' && (
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 animate-pulse" />
                </div>
              )}
            </div>
            
            {/* Title and Badge */}
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                Microphone Access Needed
              </h3>
              {permissionStatus === 'denied' && (
                <Badge variant="destructive" className="text-xs sm:text-sm px-3 py-1">
                  Permission Denied
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4 sm:mb-6">
            <p className="text-sm sm:text-base text-gray-700 text-center leading-relaxed">
              Allow microphone access to make calls and send voice messages in this chat.
            </p>
          </div>

          {/* Action Button - Creative Design */}
          <div className="mb-3 sm:mb-4">
            <Button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold text-sm sm:text-base py-3 sm:py-4 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRequesting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  <span>Requesting Permission...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Grant Permission</span>
                </span>
              )}
            </Button>
          </div>

          {/* Instructions Toggle - Mobile Friendly */}
          <div className="border-t border-blue-200/50 pt-3 sm:pt-4">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors py-2 rounded-lg hover:bg-blue-50"
            >
              {showInstructions ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span>Hide Instructions</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>Need Help?</span>
                </>
              )}
            </button>

            {/* Instructions Panel - Animated */}
            {showInstructions && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200/50 shadow-sm animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Info className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      How to enable microphone manually:
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      {instructions}
                    </p>
                    {permissionStatus === 'denied' && (
                      <p className="text-xs sm:text-sm text-red-600 mt-3 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                        ⚠️ Note: You may need to refresh the page after enabling the permission.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicrophonePermissionPrompt;

