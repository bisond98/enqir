import { useState, useEffect, useRef } from 'react';
import { Trash2, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<{ error: any | null }>;
  userName?: string;
}

export const DeleteAccountDialog = ({ isOpen, onClose, onConfirm, userName }: DeleteAccountDialogProps) => {
  const { verifyPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const verifyingRef = useRef(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmationText('');
      setPassword('');
      setIsConfirmed(false);
      setIsLoading(false);
      setIsPasswordValid(false);
      setPasswordError(null);
      setIsVerifying(false);
      verifyingRef.current = false;
    }
  }, [isOpen]);

  // Verify password when both password and DELETE are entered
  useEffect(() => {
    // Don't verify if already verifying or if requirements not met
    if (!password.trim() || !isConfirmed) {
      setIsPasswordValid(false);
      setPasswordError(null);
      setIsVerifying(false);
      verifyingRef.current = false;
      return;
    }

    // Prevent multiple simultaneous verifications
    if (verifyingRef.current) {
      return;
    }

    let isCancelled = false;

    const checkPassword = async () => {
      verifyingRef.current = true;
      setIsVerifying(true);
      setPasswordError(null);
      
      try {
        const result = await verifyPassword(password);
        
        if (!isCancelled) {
          setIsVerifying(false);
          setIsPasswordValid(result.isValid);
          verifyingRef.current = false;
          
          if (!result.isValid) {
            setPasswordError(result.error || 'Password verification failed');
          } else {
            setPasswordError(null);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          setIsVerifying(false);
          setIsPasswordValid(false);
          verifyingRef.current = false;
          setPasswordError('Password verification failed');
        }
      }
    };

    // Debounce password verification
    const timer = setTimeout(checkPassword, 500);
    return () => {
      isCancelled = true;
      verifyingRef.current = false;
      clearTimeout(timer);
    };
  }, [password, isConfirmed, verifyPassword]);

  const handleConfirm = async () => {
    if (!isConfirmed || !isPasswordValid || !password.trim()) return;
    
    setIsLoading(true);
    const result = await onConfirm(password);
    setIsLoading(false);
    
    // Only close if deletion was successful (no error)
    if (!result?.error) {
      setPassword('');
      setConfirmationText('');
      setIsConfirmed(false);
      setIsPasswordValid(false);
      setPasswordError(null);
      onClose();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmationText(value);
    // Trim and compare case-insensitively
    setIsConfirmed(value.trim().toLowerCase() === 'delete');
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
            <Label htmlFor="password" className="text-sm font-medium">
              Enter your password to confirm:
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`text-sm ${
                isPasswordValid ? 'border-green-500 focus:border-green-500' : 
                passwordError ? 'border-red-500 focus:border-red-500' : ''
              }`}
              disabled={isLoading || isVerifying}
              autoComplete="current-password"
            />
            {isVerifying && (
              <p className="text-xs text-gray-600">
                Verifying password...
              </p>
            )}
            {passwordError && !isVerifying && (
              <p className="text-xs text-red-600">
                {passwordError}
              </p>
            )}
            {isPasswordValid && !isVerifying && (
              <p className="text-xs text-green-600 font-medium">
                ✓ Password verified
              </p>
            )}
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
              className={`text-sm ${isConfirmed ? 'border-green-500 focus:border-green-500' : ''}`}
              disabled={isLoading}
            />
            {confirmationText && !isConfirmed && (
              <p className="text-xs text-red-600">
                Please type exactly "DELETE" (case-insensitive)
              </p>
            )}
            {isConfirmed && (
              <p className="text-xs text-green-600 font-medium">
                ✓ Confirmation text matches
              </p>
            )}
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
              disabled={!isConfirmed || !isPasswordValid || isLoading || isVerifying}
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
