import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LogOut } from 'lucide-react';

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const SignOutDialog = ({ open, onOpenChange, onConfirm }: SignOutDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-sm border-4 border-black rounded-2xl p-4 sm:p-6 mx-auto">
        <DialogHeader className="text-center space-y-2 sm:space-y-3 items-center w-full px-0">
          <div className="flex items-center justify-center w-12 h-12 sm:w-12 sm:h-12 mx-auto bg-black rounded-full flex-shrink-0">
            <LogOut className="w-5 h-5 sm:w-5 sm:h-5 text-white" />
          </div>
          <DialogTitle className="text-lg sm:text-lg font-semibold text-slate-900 text-center w-full">
            Log Out
          </DialogTitle>
          <DialogDescription className="text-[10px] sm:text-sm text-slate-600 leading-tight text-center w-full px-2 sm:px-0">
            You'll need to log in again to access your account.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-4 w-full items-stretch sm:items-center px-0">
          <Button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            variant="outline"
            className="w-full sm:flex-1 !bg-white !border-[0.5px] !border-slate-300 !text-slate-700 hover:!bg-slate-50 font-black text-sm sm:text-sm py-2.5 sm:py-2.5 px-4 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 sm:gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] min-h-[40px] sm:min-h-[44px] relative overflow-hidden group/cancel"
          >
            {/* Physical button depth effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/cancel:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
            <span className="relative z-10">Cancel</span>
          </Button>
          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            variant="outline"
            className="w-full sm:flex-1 !bg-black !text-white !border-black hover:!bg-black hover:!text-white hover:!border-black font-black text-sm sm:text-sm py-2.5 sm:py-2.5 px-4 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 sm:gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] min-h-[40px] sm:min-h-[44px] relative overflow-hidden group/logout"
            style={{ 
              backgroundColor: '#000000 !important', 
              color: '#ffffff !important', 
              borderColor: '#000000 !important',
              borderWidth: '0.5px',
              backgroundImage: 'none !important'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.setProperty('background-color', '#000000', 'important');
              e.currentTarget.style.setProperty('color', '#ffffff', 'important');
              e.currentTarget.style.setProperty('border-color', '#000000', 'important');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.setProperty('background-color', '#000000', 'important');
              e.currentTarget.style.setProperty('color', '#ffffff', 'important');
              e.currentTarget.style.setProperty('border-color', '#000000', 'important');
            }}
          >
            {/* Physical button depth effect - Removed for pure black */}
            {/* Shimmer effect - Removed for pure black */}
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 relative z-10">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Logging out...</span>
              </div>
            ) : (
              <span className="relative z-10">Log Out</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignOutDialog;