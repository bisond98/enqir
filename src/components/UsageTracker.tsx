import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, MessageSquare, Send, Eye, TrendingUp } from 'lucide-react';
import { useUsage } from '@/contexts/UsageContext';

interface UsageTrackerProps {
  showUpgrade?: boolean;
  onUpgrade?: () => void;
}

export const UsageTracker: React.FC<UsageTrackerProps> = ({ 
  showUpgrade = true,
  onUpgrade 
}) => {
  const {
    user,
    usageStats,
    getRemainingEnquiries,
    getRemainingSubmissions,
    getAvailableCredits
  } = useUsage();

  if (!user) return null;

  const enquiriesRemaining = getRemainingEnquiries();
  const submissionsRemaining = getRemainingSubmissions();
  const enquiriesUsed = usageStats.enquiriesPosted;
  const submissionsUsed = usageStats.supplierSubmissions;
  const totalEnquiryCredits = getAvailableCredits('enquiries');
  const totalSubmissionCredits = getAvailableCredits('submissions');

  const enquiriesProgress = (enquiriesUsed / totalEnquiryCredits) * 100;
  const submissionsProgress = (submissionsUsed / totalSubmissionCredits) * 100;

  return (
    <Card className="bg-gradient-to-br from-background to-pal-blue/5 border-pal-blue/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-pal-blue" />
            Usage Overview
          </CardTitle>
          <Badge variant="secondary" className="bg-pal-blue/10 text-pal-blue">
            Pay-per-Use
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Buyer Usage */}
        {(user.role === 'buyer' || user.role === 'both') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-pal-blue" />
                <span className="font-medium">Enquiries Posted</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium">
                  {enquiriesUsed}/{totalEnquiryCredits} used
                </span>
                <p className="text-xs text-muted-foreground">
                  {usageStats.purchasedCredits.enquiries} purchased credits
                </p>
              </div>
            </div>
            
            <Progress 
              value={enquiriesProgress} 
              className="h-2"
            />
            
            {enquiriesRemaining <= 2 && (
              <p className="text-sm text-orange-600 font-medium">
                ⚠️ Only {enquiriesRemaining} enquiries remaining
              </p>
            )}
          </div>
        )}

        {/* Supplier Usage */}
        {(user.role === 'supplier' || user.role === 'both') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-pal-blue" />
                <span className="font-medium">Responses Submitted</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium">
                  {submissionsUsed}/{totalSubmissionCredits} used
                </span>
                <p className="text-xs text-muted-foreground">
                  {usageStats.purchasedCredits.submissions} purchased credits
                </p>
              </div>
            </div>
            
            <Progress 
              value={submissionsProgress} 
              className="h-2"
            />
            
            {submissionsRemaining <= 1 && (
              <p className="text-sm text-orange-600 font-medium">
                ⚠️ Only {submissionsRemaining} submissions remaining
              </p>
            )}
          </div>
        )}

        {/* Response Views */}
        {(user.role === 'buyer' || user.role === 'both') && (
          <div className="bg-pal-blue/5 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-pal-blue" />
                <span className="font-medium text-sm">Response Views</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {usageStats.purchasedCredits.responseViews + 2} total credits
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Buy credits to view supplier responses
            </p>
          </div>
        )}

        {/* Buy Credits Button */}
        {showUpgrade && (
          <Button 
            className="w-full bg-pal-blue hover:bg-pal-blue-dark text-white font-semibold"
            onClick={onUpgrade}
          >
            <Crown className="h-4 w-4 mr-2" />
            Buy More Credits
          </Button>
        )}
      </CardContent>
    </Card>
  );
};