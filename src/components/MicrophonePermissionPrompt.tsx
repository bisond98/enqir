import React, { useState } from 'react';
import { Mic, MicOff, ChevronDown, ChevronUp, Info } from 'lucide-react';
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

  return (
    <Card className={`border-blue-200 bg-blue-50 shadow-md rounded-2xl ${className}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {permissionStatus === 'denied' ? (
              <MicOff className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            ) : (
              <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                Microphone Permission Required
              </h3>
              {permissionStatus === 'denied' && (
                <Badge variant="destructive" className="text-xs">
                  Denied
                </Badge>
              )}
            </div>
            
            <p className="text-xs sm:text-sm text-gray-700 mb-3">
              Allow microphone access to make calls and send voice messages in this chat.
            </p>

            {/* Action Button */}
            <Button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 h-8 sm:h-9 mb-2"
            >
              {isRequesting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Requesting...
                </>
              ) : (
                <>
                  <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                  Grant Permission
                </>
              )}
            </Button>

            {/* Instructions Toggle */}
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {showInstructions ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Hide Instructions
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Need Help?
                </>
              )}
            </button>

            {/* Instructions Panel */}
            {showInstructions && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-start gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900 mb-1">
                      How to enable microphone manually:
                    </p>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {instructions}
                    </p>
                    {permissionStatus === 'denied' && (
                      <p className="text-xs text-red-600 mt-2 font-medium">
                        Note: You may need to refresh the page after enabling the permission.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MicrophonePermissionPrompt;

