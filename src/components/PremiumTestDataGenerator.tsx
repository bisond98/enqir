import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';

const PremiumTestDataGenerator = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const generateTestData = async () => {
    if (!user?.uid) {
      setResult({ success: false, message: 'Please sign in first!' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const categories = ['automobile', 'electronics', 'fashion', 'home-furniture', 'real-estate'];
      const plans = ['free', 'basic', 'standard', 'premium'];
      const enquiryIds: string[] = [];

      console.log('🚀 Starting test data generation...');

      // Test scenarios with specific response counts
      const testScenarios = [
        { plan: 'free', count: 5, description: 'Free Plan (2/5 visible)' },
        { plan: 'basic', count: 8, description: 'Basic Plan (5/8 visible)' },
        { plan: 'standard', count: 10, description: 'Standard - Exactly 10 (10/10 visible)' },
        { plan: 'standard', count: 15, description: 'Standard - More than 10 (10/15 visible)' },
        { plan: 'premium', count: 20, description: 'Premium - All visible (20/20)' },
      ];

      // Create 5 test enquiries with different plans
      for (let i = 0; i < testScenarios.length; i++) {
        const scenario = testScenarios[i];
        const plan = scenario.plan;
        const category = categories[i % categories.length];
        
        const enquiryData = {
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || 'Test User',
          title: `Test: ${scenario.description}`,
          description: `This enquiry tests ${scenario.description}. It has ${scenario.count} seller responses to test the payment plan limits properly.`,
          budget: (i + 1) * 1000,
          category,
          location: 'Test Location',
          imageUrls: [],
          imageNames: [],
          imageCount: 0,
          status: 'active',
          selectedPlanId: plan,
          isPremium: plan !== 'free',
          isAutoProEnquiry: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          views: 0,
          responseCount: 0
        };

        const enquiryRef = await addDoc(collection(db, 'enquiries'), enquiryData);
        enquiryIds.push(enquiryRef.id);
        console.log(`✅ Created ${plan} enquiry: ${enquiryRef.id}`);

        // Generate seller responses based on scenario
        const responseCount = scenario.count;

        // Create seller responses
        for (let j = 0; j < responseCount; j++) {
          const submissionData = {
            enquiryId: enquiryRef.id,
            sellerId: `test_seller_${j + 1}`,
            sellerName: `Test Seller ${j + 1}`,
            sellerEmail: `seller${j + 1}@test.com`,
            title: `Response to ${plan.toUpperCase()} Enquiry`,
            message: `I can help with this! I have ${j + 1} years of experience. This is test response #${j + 1} for testing the ${plan} plan response limits.`,
            price: `₹${(j + 1) * 500}`,
            notes: `Additional details from seller ${j + 1}`,
            imageUrls: [],
            imageNames: [],
            imageCount: 0,
            govIdType: 'Aadhar',
            govIdNumber: `XXXX-XXXX-${1000 + j}`,
            govIdUrl: '',
            govIdFileName: '',
            isIdentityVerified: j % 2 === 0, // Alternate verified/unverified
            status: 'approved',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            buyerViewed: false,
            chatEnabled: true
          };

          await addDoc(collection(db, 'sellerSubmissions'), submissionData);
        }

        console.log(`✅ Created ${responseCount} responses for ${plan} enquiry`);
      }

      // Create one expired enquiry
      const expiredEnquiryData = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Test User',
        title: 'Test EXPIRED Enquiry',
        description: 'This enquiry has expired (deadline passed). Test for expired enquiry handling.',
        budget: 5000,
        category: 'electronics',
        location: 'Test Location',
        imageUrls: [],
        imageNames: [],
        imageCount: 0,
        status: 'active',
        selectedPlanId: 'basic',
        isPremium: true,
        isAutoProEnquiry: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (EXPIRED)
        views: 0,
        responseCount: 0
      };

      const expiredEnquiryRef = await addDoc(collection(db, 'enquiries'), expiredEnquiryData);
      console.log(`✅ Created expired enquiry: ${expiredEnquiryRef.id}`);

      // Create 3 responses for expired enquiry
      for (let j = 0; j < 3; j++) {
        const submissionData = {
          enquiryId: expiredEnquiryRef.id,
          sellerId: `test_seller_expired_${j + 1}`,
          sellerName: `Test Seller ${j + 1}`,
          sellerEmail: `seller${j + 1}@test.com`,
          title: 'Response to EXPIRED Enquiry',
          message: `This is a response to an expired enquiry. Test response #${j + 1}.`,
          price: `₹${(j + 1) * 1000}`,
          notes: 'This response is for testing expired enquiry handling',
          imageUrls: [],
          imageNames: [],
          imageCount: 0,
          govIdType: 'Aadhar',
          govIdNumber: `XXXX-XXXX-${2000 + j}`,
          govIdUrl: '',
          govIdFileName: '',
          isIdentityVerified: true,
          status: 'approved',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          buyerViewed: false,
          chatEnabled: true
        };

        await addDoc(collection(db, 'sellerSubmissions'), submissionData);
      }

      console.log('✅ Created 3 responses for expired enquiry');

      setResult({
        success: true,
        message: `✅ Success! Created ${enquiryIds.length + 1} test enquiries:\n\n• FREE: 5 responses (shows 2)\n• BASIC: 8 responses (shows 5)\n• STANDARD: Exactly 10 responses (shows all 10)\n• STANDARD: 15 responses (shows 10)\n• PREMIUM: 20 responses (shows all 20)\n• EXPIRED: 1 expired enquiry\n\n🎯 All edge cases covered! Go to "My Enquiries" to test response limits.`
      });

      console.log('🎉 Test data generation complete!');
    } catch (error) {
      console.error('❌ Error generating test data:', error);
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSellerResponses = async () => {
    if (!user?.uid) {
      setResult({ success: false, message: 'Please sign in first!' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('🚀 Generating seller responses for current user...');

      // Create 5 test seller submissions (responses user made to other enquiries)
      for (let i = 0; i < 5; i++) {
        const submissionData = {
          enquiryId: `test_enquiry_${i + 1}`,
          sellerId: user.uid,
          sellerName: user.displayName || 'Test User',
          sellerEmail: user.email,
          title: `Your Response #${i + 1}`,
          message: `This is your test response #${i + 1}. You responded to someone's enquiry. Status: ${i % 3 === 0 ? 'approved' : i % 3 === 1 ? 'pending' : 'rejected'}`,
          price: `₹${(i + 1) * 1500}`,
          notes: `Test notes for response ${i + 1}`,
          imageUrls: [],
          imageNames: [],
          imageCount: 0,
          govIdType: 'Aadhar',
          govIdNumber: `XXXX-XXXX-${3000 + i}`,
          govIdUrl: '',
          govIdFileName: '',
          isIdentityVerified: true,
          status: i % 3 === 0 ? 'approved' : i % 3 === 1 ? 'pending' : 'rejected',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          buyerViewed: false,
          chatEnabled: true
        };

        await addDoc(collection(db, 'sellerSubmissions'), submissionData);
        console.log(`✅ Created seller submission #${i + 1}`);
      }

      setResult({
        success: true,
        message: `✅ Success! Created 5 seller responses:\n\n• 2 Approved\n• 2 Pending\n• 1 Rejected\n\nCheck "Your Responses" in Dashboard!`
      });

      console.log('🎉 Seller responses generated!');
    } catch (error) {
      console.error('❌ Error generating seller responses:', error);
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <Card className="max-w-2xl mx-auto my-8 shadow-xl border-2 border-purple-200">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Database className="h-6 w-6" />
          Premium Test Data Generator
        </CardTitle>
        <p className="text-purple-100 text-sm mt-2">
          Automatically generate test enquiries and responses to test premium features
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              ⚠️ Please sign in first to generate test data
            </p>
          </div>
        )}

        {user && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 font-semibold mb-2">Signed in as:</p>
              <p className="text-blue-700 text-sm">{user.email}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={generateTestData}
                disabled={loading || !user}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Test Data...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-5 w-5" />
                    Generate Test Enquiries (Buyer Side)
                  </>
                )}
              </Button>

              <Button
                onClick={generateSellerResponses}
                disabled={loading || !user}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-6 text-lg"
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Responses...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-5 w-5" />
                    Generate Seller Responses (Seller Side)
                  </>
                )}
              </Button>
            </div>

            {result && (
              <div
                className={`rounded-lg p-4 border-2 ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <p
                    className={`text-sm whitespace-pre-line ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.message}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-slate-900 text-sm">📊 Test Enquiries Created:</h3>
              <div className="space-y-1 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white">FREE</Badge>
                  <span>5 responses → <strong>Shows 2 only</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-100">BASIC</Badge>
                  <span>8 responses → <strong>Shows 5 only</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-100">STANDARD</Badge>
                  <span>Exactly 10 responses → <strong>Shows all 10</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-100">STANDARD</Badge>
                  <span>15 responses → <strong>Shows 10 only</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-100">PREMIUM</Badge>
                  <span>20 responses → <strong>Shows all 20</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-100">EXPIRED</Badge>
                  <span>1 expired enquiry (deadline passed)</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-300">
                💡 This tests all edge cases: less than limit, exactly at limit, more than limit, unlimited
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-900 text-sm">
                <strong>💡 Tip:</strong> After generating, visit:
              </p>
              <ul className="text-amber-800 text-sm mt-2 space-y-1 ml-4 list-disc">
                <li>Dashboard - see tiles load instantly</li>
                <li>My Enquiries - check response limits per plan</li>
                <li>My Responses - see your seller submissions</li>
                <li>Browser Console - run <code className="bg-amber-100 px-1 rounded">window.testPremiumPlanLimits()</code></li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
      </div>
    </Layout>
  );
};

export default PremiumTestDataGenerator;

