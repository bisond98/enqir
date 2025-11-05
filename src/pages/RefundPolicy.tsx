import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8" />
              <div>
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">Refund & Cancellation Policy</CardTitle>
                <p className="text-green-100 mt-2 text-xs sm:text-sm">Last Updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ScrollArea className="h-[calc(100vh-8rem)] sm:h-[70vh] pr-2 sm:pr-4">
              <div className="space-y-4 sm:space-y-6 text-gray-700 text-sm sm:text-base">
                
                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">1. Overview</h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed">
                    At Enqir.in, we strive to provide the best experience for our users. This Refund and Cancellation Policy outlines the circumstances under which refunds are provided for our AI-powered marketplace services. This policy is designed to comply with the Consumer Protection (E-Commerce) Rules, 2020 and the Consumer Protection Act, 2019.
                  </p>
                  <p className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500 leading-relaxed">
                    <strong>Important:</strong> All payments are processed securely through third-party payment gateways and trusted payment partners. Once a payment plan is activated and responses are unlocked, the service is considered delivered. Refunds are processed through our payment gateway to the original payment method.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    2. Refund Eligibility
                  </h2>
                  <p className="mb-4">Refunds are ONLY provided in the following scenarios:</p>
                  
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">✅ Technical Payment Errors</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Payment was deducted from your account but the service was not activated</li>
                        <li>Payment gateway error prevented proper service delivery</li>
                        <li>System malfunction after successful payment</li>
                        <li>Responses were not unlocked despite successful payment</li>
                      </ul>
                      <p className="mt-2 text-sm text-gray-600">
                        <strong>Action Required:</strong> Report the issue within 24 hours with transaction ID and screenshot.
                      </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">✅ Duplicate/Accidental Payments</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Accidental double-click resulting in duplicate charges</li>
                        <li>Same plan purchased multiple times due to technical glitch</li>
                        <li>Multiple payments processed for a single transaction</li>
                      </ul>
                      <p className="mt-2 text-sm text-gray-600">
                        <strong>Refund:</strong> Full refund for the duplicate transaction(s).
                      </p>
                    </div>

                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-500">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1.5 sm:mb-2">✅ Service Not Delivered</h3>
                      <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                        <li>Payment confirmed but no upgrade/unlocking occurred</li>
                        <li>Plan activation failed despite successful payment</li>
                        <li>Service is defective or not as described (mandatory refund under Indian consumer protection laws)</li>
                      </ul>
                      <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                        <strong>Refund:</strong> Full refund after verification. We cannot refuse refunds for defective products or services not as described.
                      </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">✅ Unauthorized Transactions</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Fraudulent transaction made without your authorization</li>
                        <li>Account compromised and payment made by unauthorized person</li>
                      </ul>
                      <p className="mt-2 text-sm text-gray-600">
                        <strong>Action Required:</strong> File a complaint with transaction proof, police report (if applicable), and identity verification.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <XCircle className="w-6 h-6 text-red-600" />
                    3. Non-Refundable Scenarios
                  </h2>
                  <p className="mb-4">Refunds will NOT be provided in the following cases:</p>
                  
                  <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">❌ Change of Mind</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>You changed your mind after viewing unlocked seller responses</li>
                        <li>You decided you don't need the service anymore</li>
                        <li>You found an alternative solution</li>
                      </ul>
                      <p className="mt-2 text-sm text-red-700 font-semibold">
                        Digital content is delivered instantly upon payment. Once unlocked, it cannot be "returned."
                      </p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">❌ Dissatisfaction with Seller Responses</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Quality of seller responses did not meet your expectations</li>
                        <li>Seller quotes are too high</li>
                        <li>Sellers did not respond quickly enough</li>
                        <li>Number of responses received is lower than expected</li>
                      </ul>
                      <p className="mt-2 text-sm text-red-700 font-semibold">
                        Enqir.in facilitates connections but does not control seller content. Payment unlocks access, not guaranteed results.
                      </p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">❌ No Seller Responses Received</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Your enquiry did not receive any seller responses</li>
                        <li>Low response rate due to niche category or high budget</li>
                      </ul>
                      <p className="mt-2 text-sm text-red-700 font-semibold">
                        Payment unlocks "access" to view responses, not guaranteed responses. Sellers are independent third parties.
                      </p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">❌ Terms of Service Violation</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Account suspended or terminated for violating Terms and Conditions</li>
                        <li>Fraudulent activity detected on your account</li>
                        <li>Abusive behavior towards other users</li>
                      </ul>
                    </div>


                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">❌ Late Refund Requests</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Refund request raised more than 24 hours after payment</li>
                      </ul>
                      <p className="mt-2 text-sm text-red-700 font-semibold">
                        All refund requests must be submitted within 24 hours of transaction.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-blue-600" />
                    4. Refund Request Process
                  </h2>
                  <p className="mb-4">To request a refund, follow these steps:</p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Contact Support Within 24 Hours</h3>
                        <p className="text-sm text-gray-600">Email <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a> with subject "Refund Request - [Transaction ID]"</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Provide Required Information</h3>
                        <ul className="text-sm text-gray-600 list-disc pl-5 mt-1">
                          <li>Full Name and Registered Email</li>
                          <li>Transaction ID / Payment Reference Number</li>
                          <li>Date and Amount of Payment</li>
                          <li>Reason for Refund Request</li>
                          <li>Screenshot of Payment Confirmation</li>
                          <li>Screenshot showing the issue (if applicable)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Wait for Verification</h3>
                        <p className="text-sm text-gray-600">Our team will review your request within 2-3 business days and contact you via email</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">4</div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Refund Processing</h3>
                        <p className="text-sm text-gray-600">If approved, refund will be initiated within 5-7 business days</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">5</div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Receive Refund</h3>
                        <p className="text-sm text-gray-600">Refund credited to original payment method within 7-10 business days (depending on your bank)</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">5. Refund Timeline</h2>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <ul className="space-y-1.5 sm:space-y-2">
                      <li className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Request Review:</strong> 2-3 business days</span>
                      </li>
                      <li className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Refund Initiation:</strong> 5-7 business days after approval (through payment gateway)</span>
                      </li>
                      <li className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Bank Credit (UPI/Wallets):</strong> 3-5 business days</span>
                      </li>
                      <li className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span><strong>Bank Credit (Cards/Net Banking):</strong> 7-10 business days</span>
                      </li>
                    </ul>
                    <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
                      <strong>Total Maximum Time:</strong> Up to 20 business days from request to bank credit. Refunds are processed through our payment gateway to the original payment method used for the transaction.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">6. Cancellation Policy</h2>
                  <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border-l-4 border-yellow-500">
                    <p className="mb-2 sm:mb-3 leading-relaxed">
                      <strong>Digital Services - No Cancellation After Purchase:</strong>
                    </p>
                    <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                      <li>Once a payment plan is purchased and activated, it cannot be cancelled</li>
                      <li>Digital content (unlocked responses) is delivered instantly and irreversibly</li>
                      <li>You may request a refund only if eligible under Section 2 above</li>
                      <li>We cannot impose cancellation charges unless we also bear similar charges if we cancel an order ourselves</li>
                    </ul>
                    <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                      <strong>Note:</strong> For physical products (if any), cancellation may be allowed within 15 days of purchase, subject to return shipping costs as specified in Section 7 below.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">7. Payment Plan-Specific Terms</h2>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <div className="border-l-4 border-purple-500 pl-3 sm:pl-4">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Free Plan (₹0)</h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">No payment, no refund applicable</p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-3 sm:pl-4">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Basic Plan (₹99)</h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Unlocks 5 responses for one enquiry. No refund after viewing responses.</p>
                    </div>

                    <div className="border-l-4 border-green-500 pl-3 sm:pl-4">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Standard Plan (₹199)</h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Unlocks 10 responses for one enquiry. No refund after viewing responses.</p>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-3 sm:pl-4">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Premium Plan (₹499)</h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Unlocks unlimited responses for one enquiry. No refund after activation.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">7.1 Return Shipping Costs (For Physical Products, if any)</h2>
                  <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border-l-4 border-yellow-500">
                    <p className="leading-relaxed mb-2 sm:mb-3">
                      For digital services, return shipping is not applicable as content is delivered instantly. However, for physical products (if any):
                    </p>
                    <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                      <li>The customer will be responsible for paying for their own shipping costs for returning their item</li>
                      <li>Shipping costs are non-refundable unless the return is due to our error or a defective product</li>
                      <li>Original shipping costs are not refunded unless the product is defective or not as described</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">8. Grievance Officer</h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed">
                    In accordance with the Consumer Protection (E-Commerce) Rules, 2020, we have appointed a Grievance Officer to address your refund and cancellation concerns:
                  </p>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-500">
                    <p className="mb-2"><strong>Name:</strong> Nived Sunil S</p>
                    <p className="mb-2"><strong>Email:</strong> <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a></p>
                    <p className="mb-2"><strong>Phone:</strong> +91 9747460245</p>
                    <p className="mb-2"><strong>Address:</strong> Kunnath house, Thenkara Po Mannarkkad, Palakkad, Kerala</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-2"><strong>Response Time:</strong> Within 24-48 hours</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">9. Dispute Resolution</h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed">
                    If your refund request is rejected and you disagree with the decision:
                  </p>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                    <li>You may escalate to our Grievance Officer at <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a></li>
                    <li>You may also contact our senior support team at <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline">info@enqir.in</a></li>
                    <li>Provide additional evidence or documentation to support your claim</li>
                    <li>Final decision rests with Enqir.in management</li>
                    <li>If still unresolved, you may pursue legal recourse as per our Terms and Conditions and applicable Indian consumer protection laws</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">10. Contact Information</h2>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <p className="mb-2 sm:mb-3"><strong>For Refund Requests:</strong></p>
                    <p className="mb-2"><strong>Email:</strong> <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a></p>
                    <p className="mb-2"><strong>Support Email:</strong> <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a></p>
                    <p className="mb-2"><strong>Business Name:</strong> Enqir (Individual/Sole Proprietorship)</p>
                    <p className="mb-2"><strong>Owner Name:</strong> Nived Sunil S</p>
                    <p className="mb-2"><strong>Phone:</strong> +91 9747460245</p>
                    <p className="mb-2"><strong>Physical Address:</strong> Kunnath house, Thenkara Po Mannarkkad, Palakkad, Kerala</p>
                    <p className="mb-3 sm:mb-4"><strong>Response Time:</strong> Within 24-48 hours</p>
                    
                    <p className="mb-2 sm:mb-3"><strong>Required Information in Email:</strong></p>
                    <ul className="list-disc pl-5 sm:pl-6 space-y-1 text-xs sm:text-sm text-gray-600 leading-relaxed">
                      <li>Subject: "Refund Request - [Transaction ID]"</li>
                      <li>Your registered email and name</li>
                      <li>Transaction ID and payment amount</li>
                      <li>Detailed reason for refund</li>
                      <li>Supporting screenshots/documents</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">11. Policy Updates</h2>
                  <p className="leading-relaxed">
                    We reserve the right to modify this Refund and Cancellation Policy at any time. Changes will be effective immediately upon posting on this page with an updated "Last Updated" date. Continued use of the Platform after changes constitutes acceptance. We will notify users of significant changes via email or Platform notification.
                  </p>
                </section>

                <section className="border-t pt-4 sm:pt-6 mt-4 sm:mt-6 bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">📌 Important Reminder</h3>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    Enqir.in is a <strong>marketplace platform</strong> that facilitates connections between buyers and sellers. Payment unlocks <strong>access to view seller responses</strong>, not guaranteed business outcomes or transaction success. We do not control seller content, quality, or availability. Please read all terms carefully before making a purchase.
                  </p>
                  <p className="mt-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
                    <strong>Consumer Protection:</strong> This policy complies with the Consumer Protection (E-Commerce) Rules, 2020. We cannot refuse refunds for defective products or services not as described. All refunds are processed through our payment gateway to the original payment method.
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

export default RefundPolicy;

