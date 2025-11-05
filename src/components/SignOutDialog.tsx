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
      <DialogContent className="sm:max-w-sm border-2 border-blue-200 rounded-2xl">
        <DialogHeader className="text-center space-y-3">
          <div className="flex items-center justify-center w-10 h-10 mx-auto bg-slate-100 rounded-full">
            <LogOut className="w-5 h-5 text-slate-600" />
          </div>
          <DialogTitle className="text-lg font-medium text-slate-800">
            Sign Out
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 leading-relaxed">
            You'll need to sign in again to access your account.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing out...
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