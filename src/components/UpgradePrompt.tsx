import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Star, CheckCircle } from 'lucide-react';
import { useUsage } from '@/contexts/UsageContext';

interface UpgradePromptProps {
  type: 'enquiry' | 'submission' | 'response';
  onUpgrade?: () => void;
  compact?: boolean;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  type, 
  onUpgrade,
  compact = false 
}) => {
  const { user } = useUsage();

  const getPromptContent = () => {
    switch (type) {
      case 'enquiry':
        return {
          title: 'Buy More Enquiry Credits',
          description: 'You\'ve used all your enquiry credits. Purchase more to continue posting enquiries.',
          icon: <Zap className="h-5 w-5" />,
          price: '₹50'
        };
      case 'submission':
        return {
          title: 'Buy More Submission Credits',
          description: 'You\'ve used all your submission credits. Purchase more to respond to enquiries.',
          icon: <Star className="h-5 w-5" />,
          price: '₹30'
        };
      case 'response':
        return {
          title: 'Buy Response View Credits',
          description: 'You\'ve used all your response view credits. Purchase more to see supplier proposals.',
          icon: <Crown className="h-5 w-5" />,
          price: '₹20'
        };
    }
  };

  const content = getPromptContent();
  const getFeatures = () => {
    switch (type) {
      case 'enquiry':
        return ['10 enquiry credits', 'Instant activation', 'No expiry', '24/7 support'];
      case 'submission':
        return ['10 submission credits', 'Instant activation', 'No expiry', '24/7 support'];
      case 'response':
        return ['20 response view credits', 'Instant activation', 'No expiry', '24/7 support'];
    }
  };

  const features = getFeatures();

  // Dummy activation: call onUpgrade or no-op
  const handleOk = () => {
    if (onUpgrade) onUpgrade();
  };

  if (compact) {
    return (
      <Card className="border-pal-blue/20 bg-gradient-to-r from-pal-blue/5 to-pal-blue/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pal-blue/10 rounded-full">
                {content.icon}
              </div>
              <div>
                <p className="font-medium text-sm">{content.title}</p>
                <p className="text-xs text-muted-foreground">{content.description}</p>
              </div>
            </div>
            <Button 
              size="sm" 
              className="bg-pal-blue hover:bg-pal-blue-dark"
              onClick={handleOk}
            >
              <Crown className="h-4 w-4 mr-1" />
              OK
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-pal-blue/20 bg-gradient-to-br from-pal-blue/5 via-white to-pal-blue/10 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto p-3 bg-pal-blue/10 rounded-full w-fit mb-4">
          {content.icon}
        </div>
        <CardTitle className="text-xl font-bold">{content.title}</CardTitle>
        <CardDescription className="text-base">
          {content.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl font-bold text-pal-blue">{content.price}</span>
            <span className="text-muted-foreground">one-time</span>
          </div>
          <Badge variant="secondary" className="bg-pal-blue/10 text-pal-blue">
            <Crown className="h-3 w-3 mr-1" />
            Credit Pack
          </Badge>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-center">What you get:</h4>
          <div className="grid grid-cols-2 gap-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            className="w-full bg-pal-blue hover:bg-pal-blue-dark text-white font-semibold py-3"
            onClick={handleOk}
          >
            <Crown className="h-4 w-4 mr-2" />
            OK
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Demo mode enabled: clicking OK bypasses payment and should grant access.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};