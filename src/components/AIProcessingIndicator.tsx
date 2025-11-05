import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface AIProcessingIndicatorProps {
  status: 'processing' | 'approved' | 'flagged' | 'rejected' | null;
  confidence?: number;
  reason?: string;
}

const AIProcessingIndicator: React.FC<AIProcessingIndicatorProps> = ({
  status,
  confidence,
  reason
}) => {
  if (!status) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          icon: <Bot className="h-3 w-3 animate-pulse" />,
          text: 'AI Processing...',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          description: 'AI is analyzing your submission'
        };
      case 'approved':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'AI Approved',
          className: 'bg-green-100 text-green-800 border-green-200',
          description: `Approved with ${confidence}% confidence`
        };
      case 'flagged':
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          text: 'Needs Review',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: 'Flagged for manual review'
        };
      case 'rejected':
        return {
          icon: <Clock className="h-3 w-3" />,
          text: 'AI Rejected',
          className: 'bg-red-100 text-red-800 border-red-200',
          description: 'Automatically rejected'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
      <Badge 
        variant="outline" 
        className={`text-xs ${config.className}`}
        title={config.description}
      >
        {config.icon}
        <span className="ml-1">{config.text}</span>
      </Badge>
      {confidence && (
        <span className="text-xs text-gray-500">
          {confidence}% confidence
        </span>
      )}
    </div>
  );
};

export default AIProcessingIndicator;
