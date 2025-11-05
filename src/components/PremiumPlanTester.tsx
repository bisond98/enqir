import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PAYMENT_PLANS } from '@/config/paymentPlans';

interface TestResponse {
  id: string;
  sellerName: string;
  message: string;
  timestamp: string;
}

const PremiumPlanTester: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [testResponses, setTestResponses] = useState<TestResponse[]>([]);

  // Generate test responses
  const generateTestResponses = (count: number) => {
    const responses: TestResponse[] = [];
    for (let i = 1; i <= count; i++) {
      responses.push({
        id: `response-${i}`,
        sellerName: `Seller ${i}`,
        message: `This is response number ${i} from seller ${i}`,
        timestamp: new Date().toISOString()
      });
    }
    return responses;
  };

  // Get visible responses based on plan
  const getVisibleResponses = (planId: string, responses: TestResponse[]) => {
    let responseLimit = 2; // Default free plan
    
    switch (planId) {
      case 'free':
        responseLimit = 2;
        break;
      case 'basic':
        responseLimit = 5;
        break;
      case 'standard':
        responseLimit = 10;
        break;
      case 'premium':
      case 'pro':
        responseLimit = -1; // Unlimited
        break;
      default:
        responseLimit = 2;
    }
    
    if (responseLimit === -1) {
      return responses;
    }
    
    return responses.slice(0, responseLimit);
  };

  const getLockedResponses = (planId: string, responses: TestResponse[]) => {
    const visibleResponses = getVisibleResponses(planId, responses);
    return responses.slice(visibleResponses.length);
  };

  const currentPlan = PAYMENT_PLANS.find(p => p.id === selectedPlan);
  const visibleResponses = getVisibleResponses(selectedPlan, testResponses);
  const lockedResponses = getLockedResponses(selectedPlan, testResponses);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            🧪 Premium Plan Response Limits Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Payment Plan:</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {PAYMENT_PLANS.map((plan) => (
                <Button
                  key={plan.id}
                  variant={selectedPlan === plan.id ? "default" : "outline"}
                  onClick={() => setSelectedPlan(plan.id)}
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <div className="font-semibold">{plan.name}</div>
                  <div className="text-sm">₹{plan.price}</div>
                  <div className="text-xs text-muted-foreground">
                    {plan.responses === -1 ? 'Unlimited' : `${plan.responses} responses`}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Current Plan Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Current Plan: {currentPlan?.name}</h3>
            <div className="text-sm text-blue-800">
              <p><strong>Price:</strong> ₹{currentPlan?.price}</p>
              <p><strong>Response Limit:</strong> {currentPlan?.responses === -1 ? 'Unlimited' : `${currentPlan?.responses} responses`}</p>
              <p><strong>Features:</strong> {currentPlan?.features.join(', ')}</p>
            </div>
          </div>

          {/* Test Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Generate Test Responses:</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setTestResponses(generateTestResponses(3))}>
                Generate 3 Responses
              </Button>
              <Button onClick={() => setTestResponses(generateTestResponses(5))}>
                Generate 5 Responses
              </Button>
              <Button onClick={() => setTestResponses(generateTestResponses(7))}>
                Generate 7 Responses
              </Button>
              <Button onClick={() => setTestResponses(generateTestResponses(12))}>
                Generate 12 Responses
              </Button>
              <Button onClick={() => setTestResponses([])} variant="outline">
                Clear All
              </Button>
            </div>
          </div>

          {/* Results Display */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong>Total Responses:</strong> {testResponses.length}
                </div>
                <div>
                  <strong>Visible:</strong> {visibleResponses.length}
                </div>
                <div>
                  <strong>Locked:</strong> {lockedResponses.length}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <Badge className={lockedResponses.length > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                    {lockedResponses.length > 0 ? 'LIMITED' : 'ALL_VISIBLE'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Visible Responses */}
            <div>
              <h3 className="font-semibold mb-2 text-green-700">
                ✅ Visible Responses ({visibleResponses.length}):
              </h3>
              <div className="space-y-2">
                {visibleResponses.map((response, index) => (
                  <div key={response.id} className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>{response.sellerName}</strong>
                        <p className="text-sm text-gray-600">{response.message}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Locked Responses */}
            {lockedResponses.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-red-700">
                  🔒 Locked Responses ({lockedResponses.length}):
                </h3>
                <div className="space-y-2">
                  {lockedResponses.map((response, index) => (
                    <div key={response.id} className="bg-red-50 border border-red-200 p-3 rounded-lg opacity-60">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong>{response.sellerName}</strong>
                          <p className="text-sm text-gray-600">{response.message}</p>
                        </div>
                        <Badge variant="outline" className="bg-red-100 text-red-800">
                          #{visibleResponses.length + index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Scenarios */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">🧪 Test Scenarios:</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>Free Plan (₹0):</strong> Should show only 2 responses, lock the rest</p>
                <p><strong>Basic Plan (₹99):</strong> Should show only 5 responses, lock the rest</p>
                <p><strong>Standard Plan (₹199):</strong> Should show only 10 responses, lock the rest</p>
                <p><strong>Premium Plan (₹499):</strong> Should show ALL responses (unlimited)</p>
                <p><strong>Pro Plan (₹1,499):</strong> Should show ALL responses (unlimited)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumPlanTester;
