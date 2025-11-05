import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, Zap, Shield, Star } from 'lucide-react';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  enquiryTitle: string;
  enquiryId: string;
  currentResponses: number;
  totalResponses: number;
  isMonthlySubscriber?: boolean;
  onMonthlyUpgrade?: () => void;
}

const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  enquiryTitle,
  enquiryId,
  currentResponses,
  totalResponses,
  isMonthlySubscriber = false,
  onMonthlyUpgrade
}) => {
  const remainingResponses = totalResponses - currentResponses;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Unlock All Responses
          </DialogTitle>
          <DialogDescription>
            You've viewed {currentResponses} of {totalResponses} responses for "{enquiryTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Free Responses Used</span>
              <Badge variant="outline">{currentResponses}/2</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Remaining Responses</span>
              <span className="text-sm text-slate-600">{remainingResponses} locked</span>
            </div>
          </div>

          {/* Upgrade Options */}
          <div className="space-y-4">
            {/* Per Enquiry Upgrade */}
            <div className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">Unlock This Enquiry</h3>
                  <p className="text-sm text-slate-600">View all {totalResponses} responses for this enquiry</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">₹99+</div>
                  <div className="text-xs text-slate-500">one-time</div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>View all {totalResponses} responses</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Priority customer support</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Advanced filtering options</span>
                </div>
              </div>

              <Button 
                onClick={onUpgrade}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Zap className="h-4 w-4 mr-2" />
                Unlock for ₹99+
              </Button>
            </div>

            {/* Monthly Subscription Option */}
            {!isMonthlySubscriber && onMonthlyUpgrade && (
              <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">Monthly Premium</h3>
                      <Badge className="bg-yellow-100 text-yellow-800">Best Value</Badge>
                    </div>
                    <p className="text-sm text-slate-600">10 enquiries with premium privileges</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">₹1,500</div>
                    <div className="text-xs text-slate-500">per month</div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>10 enquiries with unlimited responses</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Priority customer support</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Advanced analytics & insights</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Early access to new features</span>
                  </div>
                </div>

                <Button 
                  onClick={onMonthlyUpgrade}
                  variant="outline"
                  className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Get Monthly Premium
                </Button>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Why Upgrade?
            </h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Access to all seller responses and details</li>
              <li>• Better chances of finding the perfect match</li>
              <li>• Compare multiple offers side by side</li>
              <li>• Make informed decisions with complete information</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumUpgradeModal;

