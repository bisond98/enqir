import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const TermsAndConditions = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <CardTitle className="text-3xl font-bold">Terms and Conditions</CardTitle>
            <p className="text-purple-100 mt-2">Last Updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-6 text-gray-700">
                
                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                  <p className="mb-3">
                    Welcome to Enqir.in ("we," "our," or "the Platform"). By accessing or using our AI-powered marketplace platform, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
                  </p>
                  <p>
                    These terms constitute a legally binding agreement between you and Enqir.in. We reserve the right to update these terms at any time, and continued use of the Platform constitutes acceptance of any changes.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Service Description</h2>
                  <p className="mb-3">
                    Enqir.in is an AI-powered marketplace that connects buyers and sellers. We provide:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Free Enquiry Posting:</strong> Users can post unlimited buying enquiries at no cost</li>
                    <li><strong>Seller Response Platform:</strong> Sellers can submit responses to enquiries</li>
                    <li><strong>AI-Powered Matching:</strong> Smart algorithms match buyers with relevant sellers</li>
                    <li><strong>Freemium Response Access:</strong> Payment plans unlock access to seller responses</li>
                    <li><strong>Commission-Free Trading:</strong> Direct connections without platform commissions on transactions</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">3.1 Registration</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li>You must be at least 18 years old to use this Platform</li>
                    <li>You must provide accurate and complete information during registration</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>You agree to notify us immediately of any unauthorized use of your account</li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">3.2 Account Responsibilities</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You are solely responsible for all activities under your account</li>
                    <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
                    <li>One user may not maintain multiple accounts without prior approval</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Payment Terms</h2>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">4.1 Payment Plans</h3>
                  <div className="bg-purple-50 p-4 rounded-lg mb-3">
                    <ul className="space-y-2">
                      <li><strong>Free Plan:</strong> ₹0 - Access to 2 seller responses per enquiry</li>
                      <li><strong>Basic Plan:</strong> ₹99 - Unlock 5 seller responses per enquiry</li>
                      <li><strong>Standard Plan:</strong> ₹199 - Unlock 10 seller responses per enquiry</li>
                      <li><strong>Premium Plan:</strong> ₹499 - Unlock unlimited responses for one enquiry</li>
                      <li><strong>Pro Plan:</strong> ₹1,499 - Next 10 enquiries get automatic premium features</li>
                    </ul>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">4.2 Payment Processing</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li>All payments are processed securely through Razorpay Payment Gateway</li>
                    <li>We accept Credit Cards, Debit Cards, UPI, Net Banking, and Wallets</li>
                    <li>All prices are in Indian Rupees (INR) and include applicable taxes</li>
                    <li>Payment must be completed before accessing seller responses</li>
                    <li>We do not store your payment card information</li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">4.3 Billing</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You will be charged immediately upon selecting a payment plan</li>
                    <li>All sales are final once payment is confirmed</li>
                    <li>Digital invoices are provided via email after successful payment</li>
                    <li>Pro Plan enquiries are counted from the date of Pro activation</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Refund and Cancellation Policy</h2>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">5.1 Refund Eligibility</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li><strong>Technical Errors:</strong> Full refund if payment is deducted but service not activated due to technical failure</li>
                    <li><strong>Duplicate Payments:</strong> Full refund for accidental duplicate charges</li>
                    <li><strong>Service Not Delivered:</strong> Full refund if responses are not unlocked after successful payment</li>
                    <li><strong>Within 24 Hours:</strong> Refund requests must be raised within 24 hours of payment</li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">5.2 Non-Refundable Scenarios</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li>Change of mind after viewing unlocked responses</li>
                    <li>Dissatisfaction with seller response quality or content</li>
                    <li>Failure to receive seller responses (sellers are independent third parties)</li>
                    <li>Account suspension or termination due to Terms violation</li>
                    <li>Pro Plan after using any of the 10 premium enquiries</li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">5.3 Refund Process</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Refund requests must be sent to support@enqir.in with transaction details</li>
                    <li>Refunds are processed within 7-10 business days after approval</li>
                    <li>Refunds are credited to the original payment method</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. User Conduct and Prohibited Activities</h2>
                  <p className="mb-3">You agree NOT to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Post false, misleading, or fraudulent enquiries</li>
                    <li>Harass, abuse, or threaten other users</li>
                    <li>Use the Platform for illegal activities</li>
                    <li>Circumvent payment systems or attempt fraud</li>
                    <li>Scrape, copy, or misuse Platform data</li>
                    <li>Impersonate other users or entities</li>
                    <li>Upload malicious code, viruses, or harmful content</li>
                    <li>Spam or send unsolicited communications</li>
                    <li>Violate intellectual property rights</li>
                    <li>Manipulate AI systems or abuse platform features</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. AI and Content Moderation</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Our AI systems automatically review and approve enquiries and responses</li>
                    <li>We reserve the right to reject content that violates our policies</li>
                    <li>AI-powered matching is provided on a best-effort basis</li>
                    <li>We do not guarantee specific matching results or response quality</li>
                    <li>Image recognition features process uploaded images using AI technology</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>
                  <p className="mb-3">
                    All content on Enqir.in, including logos, designs, text, graphics, AI algorithms, and software, is owned by Enqir.in or licensed to us. You may not reproduce, distribute, or create derivative works without written permission.
                  </p>
                  <p>
                    User-generated content (enquiries, responses) remains the property of the respective users, but you grant us a non-exclusive, worldwide license to use, display, and process this content for Platform operations.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li><strong>Platform Role:</strong> Enqir.in is a facilitator connecting buyers and sellers. We are not a party to transactions between users</li>
                    <li><strong>No Guarantees:</strong> We do not guarantee the accuracy, reliability, or quality of user-generated content</li>
                    <li><strong>Third-Party Actions:</strong> We are not liable for actions, products, or services of sellers or buyers</li>
                    <li><strong>Maximum Liability:</strong> Our liability is limited to the amount you paid for the specific service</li>
                    <li><strong>Indirect Damages:</strong> We are not liable for indirect, incidental, or consequential damages</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Disclaimer of Warranties</h2>
                  <p className="mb-3">
                    THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>The Platform will be uninterrupted, secure, or error-free</li>
                    <li>Results obtained from the Platform will be accurate or reliable</li>
                    <li>Any defects will be corrected</li>
                    <li>AI features will meet your specific expectations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Data Privacy</h2>
                  <p>
                    Your privacy is important to us. Please review our <a href="/privacy-policy" className="text-purple-600 hover:underline font-semibold">Privacy Policy</a> to understand how we collect, use, and protect your personal information. By using the Platform, you consent to our data practices as described in the Privacy Policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Termination</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You may terminate your account at any time by contacting support</li>
                    <li>We may suspend or terminate your account for Terms violations</li>
                    <li>Upon termination, your access to paid features will cease</li>
                    <li>No refunds are provided for account termination due to violations</li>
                    <li>Certain provisions survive termination (payment obligations, intellectual property rights)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Governing Law and Dispute Resolution</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>These Terms are governed by the laws of India</li>
                    <li>Any disputes shall be subject to the exclusive jurisdiction of courts in [Your City/State]</li>
                    <li>You agree to attempt good-faith resolution before legal action</li>
                    <li>Arbitration may be required for certain disputes</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">14. Modifications to Terms</h2>
                  <p>
                    We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Platform after changes constitutes acceptance of the modified Terms. We will notify users of significant changes via email or Platform notification.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">15. Contact Information</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="mb-2"><strong>Company Name:</strong> Enqir</p>
                    <p className="mb-2"><strong>Email:</strong> <a href="mailto:support@enqir.in" className="text-purple-600 hover:underline">support@enqir.in</a></p>
                    <p className="mb-2"><strong>Support Email:</strong> <a href="mailto:legal@enqir.in" className="text-purple-600 hover:underline">legal@enqir.in</a></p>
                    <p><strong>Website:</strong> <a href="https://enqir.in" className="text-purple-600 hover:underline">https://enqir.in</a></p>
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    For payment-related queries, refund requests, or billing issues, please contact our support team with your transaction ID and registered email address.
                  </p>
                </section>

                <section className="border-t pt-6 mt-6">
                  <p className="text-sm text-gray-600 italic">
                    By clicking "I Accept" during registration or by using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                  </p>
                </section>

              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TermsAndConditions;

