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
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:flex-1 h-10 sm:h-10 border-slate-300 text-slate-700 hover:bg-slate-50 text-sm sm:text-sm font-medium min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px] flex items-center justify-center"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            variant="outline"
            className="w-full sm:flex-1 h-10 sm:h-10 text-sm sm:text-sm font-medium min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px] flex items-center justify-center"
            style={{ 
              backgroundColor: '#000000', 
              color: '#ffffff', 
              borderColor: '#000000',
              borderWidth: '2px',
              backgroundImage: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1f2937';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#000000';
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Logging out...</span>
              </div>
            ) : (
              'Log Out'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignOutDialog;