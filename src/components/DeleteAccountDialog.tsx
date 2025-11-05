import { useState } from 'react';
import { Trash2, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

export const DeleteAccountDialog = ({ isOpen, onClose, onConfirm, userName }: DeleteAccountDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!isConfirmed) return;
    
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
    onClose();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmationText(value);
    setIsConfirmed(value.toLowerCase() === 'delete');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-80 sm:w-96 mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-lg sm:text-xl text-slate-900">
            Delete Account
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm sm:text-base text-slate-600 mb-4">
              Are you sure you want to permanently delete your account{userName ? `, ${userName}` : ''}?
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-red-800">
                <p className="font-semibold mb-1">This action cannot be undone!</p>
                <ul className="space-y-1 text-xs">
                  <li>• All your enquiries will be deleted</li>
                  <li>• All your responses will be deleted</li>
                  <li>• Your profile data will be removed</li>
                  <li>• You will be signed out immediately</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={handleTextChange}
              placeholder="Type DELETE here"
              className="text-sm"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isConfirmed || isLoading}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
            <Shield className="h-3 w-3" />
            <span>Your data will be permanently removed from our servers</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
