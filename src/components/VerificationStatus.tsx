import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, Bot, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { db } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface VerificationStatusProps {
  itemId: string;
  itemType: 'enquiry' | 'profile' | 'response';
  onStatusChange?: (status: string) => void;
  className?: string;
}

interface VerificationData {
  status: 'pending' | 'approved' | 'rejected' | 'live';
  aiApproval?: {
    approved: boolean;
    confidence: number;
    requiresReview: boolean;
    timestamp: any;
    analysis: any;
  };
  aiVerification?: {
    verified: boolean;
    confidence: number;
    requiresReview: boolean;
    timestamp: any;
    analysis: any;
  };
  adminNotes?: string;
}

const VerificationStatus: React.FC<VerificationStatusProps> = ({
  itemId,
  itemType,
  onStatusChange,
  className = ""
}) => {
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) return;

    setIsLoading(true);
    setError(null);

    // Determine the collection based on item type
    const collectionName = itemType === 'enquiry' ? 'enquiries' : 
                          itemType === 'profile' ? 'userProfiles' : 'sellerSubmissions';

    const docRef = doc(db, collectionName, itemId);

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as VerificationData;
          setVerificationData(data);
          setIsLoading(false);
          
          // Notify parent component of status change
          if (onStatusChange) {
            onStatusChange(data.status);
          }
        } else {
          setError('Document not found');
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Error listening to verification status:', error);
        setError('Failed to load verification status');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [itemId, itemType, onStatusChange]);

  const getStatusConfig = () => {
    if (isLoading) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        text: 'Checking status...',
        variant: 'secondary' as const,
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Verifying your submission...'
      };
    }

    if (error) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        text: 'Error',
        variant: 'destructive' as const,
        className: 'bg-red-50 text-red-700 border-red-200',
        description: error
      };
    }

    if (!verificationData) {
      return {
        icon: <Clock className="h-4 w-4" />,
        text: 'Unknown',
        variant: 'secondary' as const,
        className: 'bg-gray-50 text-gray-700 border-gray-200',
        description: 'Status unknown'
      };
    }

    const { status, aiApproval, aiVerification } = verificationData;
    const aiData = aiApproval || aiVerification;

    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Under Review',
          variant: 'secondary' as const,
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          description: aiData?.requiresReview ? 'AI flagged for manual review' : 'AI is processing...'
        };
      
      case 'approved':
      case 'live':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Verified & Live',
          variant: 'default' as const,
          className: 'bg-green-50 text-green-700 border-green-200',
          description: aiData ? `AI approved with ${aiData.confidence}% confidence` : 'Approved and live!'
        };
      
      case 'rejected':
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: 'Not Approved',
          variant: 'destructive' as const,
          className: 'bg-red-50 text-red-700 border-red-200',
          description: aiData ? `AI rejected (${aiData.confidence}% confidence)` : 'Not approved'
        };
      
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Processing',
          variant: 'secondary' as const,
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          description: 'Processing your submission...'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className={`space-y-2 ${className}`}>
      <Alert className={`border ${statusConfig.className}`}>
        <div className="flex items-center gap-2">
          {statusConfig.icon}
          <AlertDescription className="flex items-center justify-between w-full">
            <div>
              <span className="font-medium">{statusConfig.text}</span>
              <p className="text-xs mt-1 opacity-80">{statusConfig.description}</p>
            </div>
            {verificationData?.aiApproval && (
              <div className="flex items-center gap-1 text-xs">
                <Bot className="h-3 w-3" />
                <span>AI</span>
              </div>
            )}
          </AlertDescription>
        </div>
      </Alert>
      
      {verificationData?.adminNotes && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <strong>Note:</strong> {verificationData.adminNotes}
        </div>
      )}
    </div>
  );
};

export default VerificationStatus;




