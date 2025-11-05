import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Smartphone, 
  Hand, 
  Volume2, 
  Wifi, 
  WifiOff,
  Zap
} from 'lucide-react';
import { 
  initializeMobileAI,
  recognizeTouchGesture,
  recognizeVoiceCommand,
  executeMobileAIAction,
  getMobileAIState,
  getMobileAIConfig,
  type TouchGesture,
  type VoiceCommand,
  type MobileAIConfig
} from '@/services/ai/mobileExperience';

interface MobileAIControllerProps {
  children: React.ReactNode;
  onGesture?: (gesture: TouchGesture) => void;
  onVoiceCommand?: (command: VoiceCommand) => void;
  config?: Partial<MobileAIConfig>;
  className?: string;
}

const MobileAIController: React.FC<MobileAIControllerProps> = ({
  children,
  onGesture,
  onVoiceCommand,
  config = {},
  className = ""
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mobileState, setMobileState] = useState<any>(null);
  const [currentGesture, setCurrentGesture] = useState<TouchGesture | null>(null);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<VoiceCommand | null>(null);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize mobile AI with performance optimization
  useEffect(() => {
    let isMounted = true;
    
    const initMobileAI = async () => {
      try {
        // Only initialize on mobile devices or when explicitly requested
        if (window.innerWidth > 1024 && !config.enableMobileOptimization) {
          console.log('📱 Mobile AI: Skipping on desktop for performance');
          setIsInitialized(false);
          return;
        }
        
        console.log('🔍 Starting Mobile AI initialization...');
        const success = await initializeMobileAI(config);
        
        if (isMounted) {
          console.log('🔍 Mobile AI init result:', success);
          setIsInitialized(success);
          
          if (success) {
            // Get initial mobile state
            const state = getMobileAIState(config);
            setMobileState(state);
            
            // Update state less frequently for better performance
            const interval = setInterval(() => {
              if (isMounted) {
                const newState = getMobileAIState(config);
                setMobileState(newState);
              }
            }, 10000); // Changed from 5000 to 10000ms
            
            return () => clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('❌ Mobile AI initialization failed:', error);
        if (isMounted) {
          setIsInitialized(false);
        }
      }
    };

    // Delay initialization to improve initial page load
    const timer = setTimeout(initMobileAI, 1000);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [config]);

  // Touch gesture handlers
  const handleTouchStart = useCallback(async (e: TouchEvent | MouseEvent) => {
    if (!isInitialized || !mobileState?.isTouchEnabled) return;
    
    try {
      const gesture = await recognizeTouchGesture(e, config);
      if (gesture) {
        setCurrentGesture(gesture);
        
        // Execute AI action
        const result = await executeMobileAIAction(gesture, config);
        console.log('📱 Gesture executed:', result);
        
        // Notify parent component
        if (onGesture) {
          onGesture(gesture);
        }
        
        // Clear gesture after a delay
        setTimeout(() => setCurrentGesture(null), 2000);
      }
    } catch (error) {
      console.error('Touch gesture handling failed:', error);
    }
  }, [isInitialized, mobileState, config, onGesture]);

  const handleTouchEnd = useCallback((e: TouchEvent | MouseEvent) => {
    // Touch end handling if needed
  }, []);

  // Voice recording handlers
  const startVoiceRecording = useCallback(async () => {
    try {
      if (!isInitialized || !mobileState?.isVoiceEnabled) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Recognize voice command
        const command = await recognizeVoiceCommand(audioBlob, config);
        if (command) {
          setLastVoiceCommand(command);
          
          // Execute AI action
          const result = await executeMobileAIAction(command, config);
          console.log('📱 Voice command executed:', result);
          
          // Notify parent component
          if (onVoiceCommand) {
            onVoiceCommand(command);
          }
          
          // Clear command after a delay
          setTimeout(() => setLastVoiceCommand(null), 3000);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Voice recording failed:', error);
    }
  }, [isInitialized, mobileState, config, onVoiceCommand]);

  const stopVoiceRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Add touch event listeners
  useEffect(() => {
    if (!containerRef.current || !isInitialized) return;
    
    const container = containerRef.current;
    
    // Touch events
    container.addEventListener('touchstart', handleTouchStart as any);
    container.addEventListener('touchend', handleTouchEnd as any);
    
    // Mouse events for desktop testing
    container.addEventListener('mousedown', handleTouchStart as any);
    container.addEventListener('mouseup', handleTouchEnd as any);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart as any);
      container.removeEventListener('touchend', handleTouchEnd as any);
      container.removeEventListener('mousedown', handleTouchStart as any);
      container.removeEventListener('mouseup', handleTouchEnd as any);
    };
  }, [handleTouchStart, handleTouchEnd, isInitialized]);

  // Get mobile AI configuration
  const mobileConfig = getMobileAIConfig(config);

  // Performance mode: Skip mobile AI on desktop unless explicitly enabled
  if (!isInitialized || (window.innerWidth > 1024 && !config.enableMobileOptimization)) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Mobile AI Controls - Moved to Settings page */}

      {/* Gesture Feedback */}
      {currentGesture && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Hand className="w-4 h-4" />
            <span className="text-sm font-medium">
              {currentGesture.type} {currentGesture.direction && `(${currentGesture.direction})`}
            </span>
          </div>
        </div>
      )}

      {/* Voice Command Feedback */}
      {lastVoiceCommand && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Mic className="w-4 h-4" />
            <span className="text-sm font-medium">
              "{lastVoiceCommand.command}"
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      {children}
    </div>
  );
};

export default MobileAIController;
