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
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-sm border-2 border-slate-200 rounded-2xl p-6 sm:p-6 mx-auto">
        <DialogHeader className="text-center space-y-4 sm:space-y-3 items-center w-full px-0">
          <div className="flex items-center justify-center w-16 h-16 sm:w-12 sm:h-12 mx-auto bg-gray-800 rounded-full flex-shrink-0">
            <LogOut className="w-7 h-7 sm:w-5 sm:h-5 text-white" />
          </div>
          <DialogTitle className="text-xl sm:text-lg font-semibold text-slate-900 text-center w-full">
            Sign Out
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-600 leading-tight text-center w-full px-2 sm:px-0">
            You'll need to sign in again to access your account.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-3 pt-6 sm:pt-4 w-full items-stretch sm:items-center px-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:flex-1 h-12 sm:h-10 border-slate-300 text-slate-700 hover:bg-slate-50 text-base sm:text-sm font-medium min-h-[44px] min-w-[44px] flex items-center justify-center"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full sm:flex-1 h-12 sm:h-10 !bg-gradient-to-r !from-gray-800 !to-gray-800 hover:!from-gray-700 hover:!to-gray-700 text-white text-base sm:text-sm font-medium min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing out...</span>
              </div>
            ) : (
              'Sign Out'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignOutDialog;