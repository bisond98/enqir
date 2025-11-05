import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Crown, Lock } from 'lucide-react';
import { useUsage } from '@/contexts/UsageContext';
import { UpgradePrompt } from './UpgradePrompt';

interface ResponseViewerProps {
  enquiryId: string;
  responses: Array<{
    id: string;
    title: string;
    price: string;
    supplier: string;
  }>;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ enquiryId, responses }) => {
  const { user, canViewResponse, incrementResponseViews, getRemainingResponseViews } = useUsage();
  const [viewedResponses, setViewedResponses] = useState<Set<string>>(new Set());
  const [showUpgrade, setShowUpgrade] = useState(false);

  const remainingViews = getRemainingResponseViews(enquiryId);

  const handleViewResponse = (responseId: string) => {
    if (!canViewResponse(enquiryId)) {
      setShowUpgrade(true);
      return;
    }

    incrementResponseViews(enquiryId);
    setViewedResponses(prev => new Set([...prev, responseId]));
  };

  return (
    <div className="space-y-4">
      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-md w-full">
            <div className="p-6">
              <UpgradePrompt 
                type="response"
                onUpgrade={() => {
                  alert('Payment processing! ₹299/month for unlimited access 💳');
                  setShowUpgrade(false);
                }}
              />
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setShowUpgrade(false)}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Limit Alert */}
      {user && (
        <Card className="bg-gradient-to-r from-pal-blue/5 to-yellow-50 border-pal-blue/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-pal-blue" />
                <div>
                  <p className="font-medium text-sm">
                    {remainingViews === Infinity ? 'Unlimited' : remainingViews} response views remaining
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Free users can view 2 responses per enquiry
                  </p>
                </div>
              </div>
              {remainingViews <= 1 && remainingViews !== Infinity && (
                <Button 
                  size="sm" 
                  className="bg-pal-blue hover:bg-pal-blue-dark"
                  onClick={() => setShowUpgrade(true)}
                >
                  <Crown className="h-4 w-4 mr-1" />
                  Upgrade
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responses */}
      {responses.map((response, index) => {
        const isViewed = viewedResponses.has(response.id);
        const canView = canViewResponse(enquiryId) || isViewed;

        return (
          <Card key={response.id} className="border-pal-blue/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Response #{index + 1}</CardTitle>
                <Badge variant="secondary">{response.supplier}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {canView ? (
                <div className="space-y-3">
                  <h4 className="font-semibold">{response.title}</h4>
                  <p className="text-lg font-bold text-pal-blue">₹{response.price}</p>
                  <Button size="sm" className="bg-pal-blue hover:bg-pal-blue-dark">
                    Contact Supplier
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Lock className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Upgrade to view this response
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => handleViewResponse(response.id)}
                    disabled={!canView}
                  >
                    {canView ? 'View Response' : 'Upgrade to View'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};