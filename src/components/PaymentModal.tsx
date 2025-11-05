import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { PaymentPlan } from '@/config/paymentPlans';
import { processPayment, savePaymentRecord, updateEnquiryPremiumStatus, updateUserPaymentPlan } from '@/services/paymentService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PaymentPlan;
  enquiryId: string;
  userId: string;
  onPaymentSuccess: (planId: string, price: number) => void;
  isUpgrade?: boolean;
  currentPlanPrice?: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  enquiryId,
  userId,
  onPaymentSuccess,
  isUpgrade = false,
  currentPlanPrice = 0
}) => {
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success' | 'failed'>('form');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: ''
  });

  const priceDifference = selectedPlan.price - currentPlanPrice;
  const finalPrice = isUpgrade ? priceDifference : selectedPlan.price;

  const handlePayment = async () => {
    setPaymentStep('processing');
    setPaymentLoading(true);
    
    try {
      // Simulate payment processing delay (2 seconds for testing)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Always succeed for testing - no need to call payment service
      console.log('✅ Dummy payment successful:', {
        enquiryId,
        userId,
        planId: selectedPlan.id,
        amount: selectedPlan.price,
        paymentDetails
      });
      
      setPaymentStep('success');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onPaymentSuccess(selectedPlan.id, selectedPlan.price);
        resetModal();
      }, 1500);
      
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStep('failed');
      setPaymentLoading(false);
    }
  };

  const resetModal = () => {
    setPaymentStep('form');
    setPaymentLoading(false);
    setPaymentDetails({ cardNumber: '', expiryDate: '', cvv: '', name: '' });
    onClose();
  };

  const isFormValid = paymentDetails.cardNumber && paymentDetails.expiryDate && 
                     paymentDetails.cvv && paymentDetails.name;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-2xl my-4 sm:my-8 flex flex-col">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {isUpgrade ? 'Upgrade Payment' : 'Complete Payment'}
            </h2>
            <button
              onClick={resetModal}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          </div>

          {paymentStep === 'form' && (
            <div className="space-y-4">
              {/* Payment Details */}
              <Card className="border-2 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    {selectedPlan.name} Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900">
                      {isUpgrade ? 'Upgrade Amount' : 'Plan Price'}
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      ₹{finalPrice}
                    </span>
                  </div>
                  {isUpgrade && (
                    <div className="text-sm text-slate-600 mb-2">
                      <div className="flex justify-between">
                        <span>New Plan: ₹{selectedPlan.price}</span>
                        <span>Current Plan: ₹{currentPlanPrice}</span>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-slate-600">
                    {selectedPlan.responses === -1 
                      ? 'Unlimited responses per enquiry' 
                      : `${selectedPlan.responses} unlocked responses per enquiry`
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Payment Form */}
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={paymentDetails.cardNumber}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                    className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={paymentDetails.expiryDate}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={paymentDetails.cvv}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))}
                      className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={paymentDetails.name}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Test Payment Notice */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-xs">🧪</span>
                  </div>
                  <div>
                    <p className="font-medium text-yellow-800 text-sm">Test Mode</p>
                    <p className="text-yellow-700 text-xs">Use any card details - payment will be simulated</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Processing Payment</h3>
              <p className="text-slate-600">Please wait while we process your payment...</p>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Payment Successful! 🎉</h3>
              <p className="text-slate-600">
                {isUpgrade 
                  ? 'Your plan has been upgraded successfully!' 
                  : 'Your payment has been processed successfully!'
                }
              </p>
            </div>
          )}

          {paymentStep === 'failed' && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Payment Failed</h3>
              <p className="text-slate-600 mb-4">
                There was an error processing your payment. Please try again.
              </p>
              <Button
                onClick={() => setPaymentStep('form')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
        
        {/* Sticky Footer with Payment Buttons - Only show in form step */}
        {paymentStep === 'form' && (
          <div className="border-t border-gray-200 p-5 bg-white rounded-b-xl shadow-lg">
            <div className="flex space-x-3">
              <Button
                onClick={resetModal}
                variant="outline"
                className="flex-1 py-3"
                disabled={paymentLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={paymentLoading || !isFormValid}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                {paymentLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-5 w-5 mr-2" />
                )}
                {isUpgrade ? `Upgrade for ₹${finalPrice}` : `Pay ₹${finalPrice}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
