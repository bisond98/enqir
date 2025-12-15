import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-4xl">
        <Card className="shadow-2xl border-0 overflow-hidden rounded-2xl sm:rounded-3xl">
          <CardHeader className="bg-black p-2 sm:p-3 md:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              <div>
                <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-white">Shipping & Refund Policy</CardTitle>
                <p className="text-gray-300 mt-0.5 sm:mt-1 text-[10px] sm:text-xs">Last Updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 md:p-4 bg-white">
            <ScrollArea className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] md:h-[70vh] pr-2 sm:pr-4">
              <div className="space-y-2 sm:space-y-3 md:space-y-4 text-gray-700 text-[10px] sm:text-xs md:text-sm leading-relaxed">
                
                <section>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">1. Overview</h2>
                  <p className="mb-1.5 sm:mb-2 leading-relaxed">
                    At Enqir.in, we strive to provide the best experience for our users. This Shipping & Refund Policy outlines our approach to shipping and delivery, as well as the circumstances under which refunds are provided for our AI-powered marketplace services. This policy is designed to comply with the Consumer Protection (E-Commerce) Rules, 2020 and the Consumer Protection Act, 2019.
                  </p>
                  <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border-l-4 border-blue-500 mb-2">
                    <p className="leading-relaxed mb-1.5 sm:mb-2">
                      <strong>Important:</strong> Enqir.in acts as a facilitator connecting buyers and sellers. We do not handle, manage, or interfere with shipping arrangements between users. All shipping terms, costs, and methods are negotiated directly between buyers and sellers through our chat feature.
                    </p>
                    <p className="leading-relaxed">
                      <strong>Payment Processing:</strong> All payments for platform services are processed securely through third-party payment gateways. Once a payment plan is activated and responses are unlocked, the service is considered delivered. Refunds are processed through our payment gateway to the original payment method.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">2. Shipping & Delivery Policy</h2>
                  
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">2.1 Platform Services (Digital - No Shipping Required)</h3>
                  <p className="mb-1.5 sm:mb-2 leading-relaxed">
                    Our platform services are entirely digital and delivered instantly:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 mb-2 leading-relaxed">
                    <li><strong>Premium Plan Activation:</strong> Instant digital delivery (within seconds of payment confirmation)</li>
                    <li><strong>Enquiry Posting:</strong> Instant digital service (enquiries appear immediately after submission)</li>
                    <li><strong>Seller Response Access:</strong> Instant digital activation (responses unlocked immediately)</li>
                    <li><strong>Feature Access:</strong> All paid features are available instantly upon activation</li>
                  </ul>
                  <p className="mb-1.5 sm:mb-2 leading-relaxed">
                    <strong>No Physical Shipping:</strong> Enqir.in does not ship any physical products. All platform services are delivered digitally through our web platform.
                  </p>

                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">2.2 User-to-User Transactions</h3>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200 mb-2">
                    <p className="mb-1.5 sm:mb-2 leading-relaxed font-semibold text-gray-800">
                      Platform Role:
                    </p>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 leading-relaxed">
                      <li><strong>Facilitator Only:</strong> Enqir.in connects buyers and sellers but does not participate in their transactions</li>
                      <li><strong>No Interference:</strong> We do not control, manage, or interfere with shipping arrangements between users</li>
                      <li><strong>No Responsibility:</strong> We are not responsible for shipping methods, costs, timelines, or delivery of products/services between users</li>
                      <li><strong>Commission-Free:</strong> We do not charge commissions on user-to-user transactions</li>
                    </ul>
                  </div>

                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">2.3 User Responsibilities</h3>
                  <p className="mb-1.5 sm:mb-2 leading-relaxed">
                    Buyers and sellers are solely responsible for:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 mb-2 leading-relaxed">
                    <li>Negotiating and agreeing on shipping methods (standard, express, local delivery, international, etc.)</li>
                    <li>Determining shipping costs and who bears the cost</li>
                    <li>Setting delivery timelines and expectations</li>
                    <li>Handling all shipping arrangements and logistics</li>
                    <li>Resolving shipping disputes directly between themselves</li>
                    <li>Ensuring proper packaging and handling of products</li>
                  </ul>

                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">2.4 Shipping Negotiation via Chat</h3>
                  <div className="bg-green-50 p-2 sm:p-3 rounded-lg border border-green-200 mb-2">
                    <p className="mb-1.5 sm:mb-2 leading-relaxed font-semibold text-gray-800">
                      Use our chat feature to discuss and agree on:
                    </p>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 leading-relaxed">
                      <li>Shipping methods (standard courier, express delivery, local pickup, international shipping, etc.)</li>
                      <li>Shipping costs and payment responsibility</li>
                      <li>Delivery timelines and expected delivery dates</li>
                      <li>Shipping addresses and delivery locations</li>
                      <li>Return shipping policies and costs</li>
                      <li>Product packaging and handling requirements</li>
                      <li>Tracking information and delivery confirmation</li>
                    </ul>
                  </div>
                  <p className="mb-1.5 sm:mb-2 leading-relaxed">
                    <strong>Note:</strong> All shipping arrangements are made directly between buyers and sellers. Enqir.in does not monitor, verify, or enforce shipping agreements between users.
                  </p>

                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">2.5 Platform Disclaimers</h3>
                  <div className="bg-red-50 p-2 sm:p-3 rounded-lg border-l-4 border-red-500 mb-2">
                    <p className="mb-1.5 sm:mb-2 leading-relaxed font-semibold text-gray-800">
                      Enqir.in is NOT responsible for:
                    </p>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 leading-relaxed">
                      <li>Shipping delays, damages, or losses between users</li>
                      <li>Shipping method selection or shipping costs</li>
                      <li>Delivery timelines or delivery failures</li>
                      <li>Product quality, packaging, or handling during shipping</li>
                      <li>Shipping disputes between buyers and sellers</li>
                      <li>Verification of shipping methods or costs</li>
                      <li>Handling shipping payments or refunds</li>
                    </ul>
                  </div>
                  <p className="mb-1.5 sm:mb-2 leading-relaxed">
                    <strong>Users transact at their own risk.</strong> Enqir.in provides the platform for connection and communication but is not a party to any shipping arrangements or product transactions between users.
                  </p>

                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">2.6 Shipping Dispute Resolution</h3>
                  <p className="mb-1.5 sm:mb-2 leading-relaxed">
                    For shipping-related disputes between buyers and sellers:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 mb-2 leading-relaxed">
                    <li><strong>Direct Resolution:</strong> Shipping disputes should be resolved directly between the buyer and seller</li>
                    <li><strong>Platform Assistance:</strong> Enqir.in may assist in facilitating communication but is not liable for shipping issues</li>
                    <li><strong>No Mediation:</strong> We do not mediate, arbitrate, or decide shipping disputes</li>
                    <li><strong>User Agreement:</strong> Users are responsible for their own shipping agreements and dispute resolution</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">3. Refund Policy</h2>
                  <p className="mb-1.5 sm:mb-2 leading-relaxed">
                    This refund policy applies <strong>ONLY to platform services</strong> (premium plans, enquiry posting, etc.). Refunds do NOT apply to transactions between buyers and sellers, as those are handled directly between users.
                  </p>
                  
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
                    3.1 Refund Eligibility
                  </h3>
                  <p className="mb-2 sm:mb-3">Refunds are ONLY provided in the following scenarios:</p>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border-l-4 border-green-500">
                      <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">✅ Technical Payment Errors</h3>
                      <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5">
                        <li>Payment was deducted from your account but the service was not activated</li>
                        <li>Payment gateway error prevented proper service delivery</li>
                        <li>System malfunction after successful payment</li>
                        <li>Responses were not unlocked despite successful payment</li>
                      </ul>
                      <p className="mt-1.5 text-[10px] sm:text-xs text-gray-600">
                        <strong>Action Required:</strong> Report the issue within 24 hours with transaction ID and screenshot.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border-l-4 border-green-500">
                      <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">✅ Duplicate/Accidental Payments</h3>
                      <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5">
                        <li>Accidental double-click resulting in duplicate charges</li>
                        <li>Same plan purchased multiple times due to technical glitch</li>
                        <li>Multiple payments processed for a single transaction</li>
                      </ul>
                      <p className="mt-1.5 text-[10px] sm:text-xs text-gray-600">
                        <strong>Refund:</strong> Full refund for the duplicate transaction(s).
                      </p>
                    </div>

                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border-l-4 border-green-500">
                      <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">✅ Service Not Delivered</h3>
                      <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 leading-relaxed">
                        <li>Payment confirmed but no upgrade/unlocking occurred</li>
                        <li>Plan activation failed despite successful payment</li>
                        <li>Service is defective or not as described (mandatory refund under Indian consumer protection laws)</li>
                      </ul>
                      <p className="mt-1.5 text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                        <strong>Refund:</strong> Full refund after verification. We cannot refuse refunds for defective products or services not as described.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border-l-4 border-green-500">
                      <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">✅ Unauthorized Transactions</h3>
                      <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5">
                        <li>Fraudulent transaction made without your authorization</li>
                        <li>Account compromised and payment made by unauthorized person</li>
                      </ul>
                      <p className="mt-1.5 text-[10px] sm:text-xs text-gray-600">
                        <strong>Action Required:</strong> File a complaint with transaction proof, police report (if applicable), and identity verification.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5 flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-600" />
                    3.2 Non-Refundable Scenarios
                  </h3>
                  <p className="mb-2 sm:mb-3">Refunds will NOT be provided in the following cases:</p>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border-l-4 border-red-500">
                      <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">❌ Change of Mind</h3>
                      <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5">
                        <li>You changed your mind after viewing unlocked seller responses</li>
                        <li>You decided you don't need the service anymore</li>
                        <li>You found an alternative solution</li>
                      </ul>
                      <p className="mt-1.5 text-[10px] sm:text-xs text-red-700 font-semibold">
                        Digital content is delivered instantly upon payment. Once unlocked, it cannot be "returned."
                      </p>
                    </div>

                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border-l-4 border-red-500">
                      <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">❌ Dissatisfaction with Seller Responses</h3>
                      <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5">
                        <li>Quality of seller responses did not meet your expectations</li>
                        <li>Seller quotes are too high</li>
                        <li>Sellers did not respond quickly enough</li>
                        <li>Number of responses received is lower than expected</li>
                      </ul>
                      <p className="mt-1.5 text-[10px] sm:text-xs text-red-700 font-semibold">
                        Enqir.in facilitates connections but does not control seller content. Payment unlocks access, not guaranteed results.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border-l-4 border-red-500">
                      <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">❌ No Seller Responses Received</h3>
                      <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5">
                        <li>Your enquiry did not receive any seller responses</li>
                        <li>Low response rate due to niche category or high budget</li>
                      </ul>
                      <p className="mt-1.5 text-[10px] sm:text-xs text-red-700 font-semibold">
                        Payment unlocks "access" to view responses, not guaranteed responses. Sellers are independent third parties.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border-l-4 border-red-500">
                      <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">❌ Terms of Service Violation</h3>
                      <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5">
                        <li>Account suspended or terminated for violating Terms and Conditions</li>
                        <li>Fraudulent activity detected on your account</li>
                        <li>Abusive behavior towards other users</li>
                      </ul>
                    </div>


                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border-l-4 border-red-500">
                      <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">❌ Late Refund Requests</h3>
                      <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5">
                        <li>Refund request raised more than 24 hours after payment</li>
                      </ul>
                      <p className="mt-1.5 text-[10px] sm:text-xs text-red-700 font-semibold">
                        All refund requests must be submitted within 24 hours of transaction.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
                    3.3 Refund Request Process
                  </h3>
                  <p className="mb-2 sm:mb-3">To request a refund, follow these steps:</p>
                  
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="bg-blue-600 text-gray-900 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center font-bold flex-shrink-0 text-xs sm:text-sm">1</div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Contact Support Within 24 Hours</h3>
                        <p className="text-[10px] sm:text-xs text-gray-600">Email <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a> with subject "Refund Request - [Transaction ID]"</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="bg-blue-600 text-gray-900 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center font-bold flex-shrink-0 text-xs sm:text-sm">2</div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Provide Required Information</h3>
                        <ul className="text-[10px] sm:text-xs text-gray-600 list-disc pl-4 sm:pl-5 mt-1">
                          <li>Full Name and Registered Email</li>
                          <li>Transaction ID / Payment Reference Number</li>
                          <li>Date and Amount of Payment</li>
                          <li>Reason for Refund Request</li>
                          <li>Screenshot of Payment Confirmation</li>
                          <li>Screenshot showing the issue (if applicable)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="bg-blue-600 text-gray-900 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center font-bold flex-shrink-0 text-xs sm:text-sm">3</div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Wait for Verification</h3>
                        <p className="text-[10px] sm:text-xs text-gray-600">Our team will review your request within 2-3 business days and contact you via email</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="bg-blue-600 text-gray-900 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center font-bold flex-shrink-0 text-xs sm:text-sm">4</div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Refund Processing</h3>
                        <p className="text-[10px] sm:text-xs text-gray-600">If approved, refund will be initiated within 5-7 business days</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="bg-blue-600 text-gray-900 rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center font-bold flex-shrink-0 text-xs sm:text-sm">5</div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Receive Refund</h3>
                        <p className="text-[10px] sm:text-xs text-gray-600">Refund credited to original payment method within 7-10 business days (depending on your bank)</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">3.4 Refund Timeline</h3>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <ul className="space-y-1 sm:space-y-1.5">
                      <li className="flex items-start gap-1.5 sm:gap-2 leading-relaxed">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-[10px] sm:text-xs"><strong>Request Review:</strong> 2-3 business days</span>
                      </li>
                      <li className="flex items-start gap-1.5 sm:gap-2 leading-relaxed">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-[10px] sm:text-xs"><strong>Refund Initiation:</strong> 5-7 business days after approval (through payment gateway)</span>
                      </li>
                      <li className="flex items-start gap-1.5 sm:gap-2 leading-relaxed">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-[10px] sm:text-xs"><strong>Bank Credit (UPI/Wallets):</strong> 3-5 business days</span>
                      </li>
                      <li className="flex items-start gap-1.5 sm:gap-2 leading-relaxed">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-[10px] sm:text-xs"><strong>Bank Credit (Cards/Net Banking):</strong> 7-10 business days</span>
                      </li>
                    </ul>
                    <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                      <strong>Total Maximum Time:</strong> Up to 20 business days from request to bank credit. Refunds are processed through our payment gateway to the original payment method used for the transaction.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">3.5 Cancellation Policy</h3>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border-l-4 border-yellow-500">
                    <p className="mb-1.5 sm:mb-2 leading-relaxed">
                      <strong>Digital Services - No Cancellation After Purchase:</strong>
                    </p>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 leading-relaxed">
                      <li>Once a payment plan is purchased and activated, it cannot be cancelled</li>
                      <li>Digital content (unlocked responses) is delivered instantly and irreversibly</li>
                      <li>You may request a refund only if eligible under Section 3.1 above</li>
                      <li>We cannot impose cancellation charges unless we also bear similar charges if we cancel an order ourselves</li>
                    </ul>
                    <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                      <strong>Note:</strong> For physical products (if any) sold by third-party sellers, cancellation and return shipping costs are negotiated directly between buyers and sellers via chat, as per Section 2.4 above.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">3.6 Payment Plan-Specific Terms</h3>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="border-l-4 border-purple-500 pl-2 sm:pl-3">
                      <h3 className="font-semibold text-gray-800 text-[10px] sm:text-xs md:text-sm">Free Plan (₹0)</h3>
                      <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">No payment, no refund applicable</p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-2 sm:pl-3">
                      <h3 className="font-semibold text-gray-800 text-[10px] sm:text-xs md:text-sm">Basic Plan (₹99)</h3>
                      <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">Unlocks 5 responses for one enquiry. No refund after viewing responses.</p>
                    </div>

                    <div className="border-l-4 border-green-500 pl-2 sm:pl-3">
                      <h3 className="font-semibold text-gray-800 text-[10px] sm:text-xs md:text-sm">Standard Plan (₹199)</h3>
                      <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">Unlocks 10 responses for one enquiry. No refund after viewing responses.</p>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-2 sm:pl-3">
                      <h3 className="font-semibold text-gray-800 text-[10px] sm:text-xs md:text-sm">Premium Plan (₹499)</h3>
                      <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">Unlocks unlimited responses for one enquiry. No refund after activation.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5">3.7 User-to-User Transaction Refunds</h3>
                  <div className="bg-yellow-50 p-2 sm:p-3 rounded-lg border-l-4 border-yellow-500">
                    <p className="leading-relaxed mb-1.5 sm:mb-2 font-semibold text-gray-800">
                      <strong>Important:</strong> Refunds for transactions between buyers and sellers are NOT handled by Enqir.in.
                    </p>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 leading-relaxed">
                      <li>Buyers and sellers negotiate refund terms directly via chat</li>
                      <li>Platform does not process refunds for user-to-user transactions</li>
                      <li>Shipping costs and return shipping are agreed upon between users</li>
                      <li>Disputes should be resolved directly between buyer and seller</li>
                      <li>Platform may assist in communication but is not liable for transaction refunds</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">4. Grievance Officer</h2>
                  <p className="mb-1.5 sm:mb-2 leading-relaxed">
                    In accordance with the Consumer Protection (E-Commerce) Rules, 2020, we have appointed a Grievance Officer to address your refund and cancellation concerns:
                  </p>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border-l-4 border-green-500">
                    <p className="mb-2"><strong>Name:</strong> zeb</p>
                    <p className="mb-2"><strong>Email:</strong> <a href="mailto:zebhere4@gmail.com" className="text-blue-600 hover:underline font-semibold">zebhere4@gmail.com</a></p>
                    <p className="text-[10px] sm:text-xs text-gray-600 mt-1.5"><strong>Response Time:</strong> Within 24-48 hours</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">5. Dispute Resolution</h2>
                  <p className="mb-1.5 sm:mb-2 leading-relaxed">
                    If your refund request is rejected and you disagree with the decision:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 leading-relaxed">
                    <li>You may escalate to our Grievance Officer at <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a></li>
                    <li>You may also contact our senior support team at <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline">info@enqir.in</a></li>
                    <li>Provide additional evidence or documentation to support your claim</li>
                    <li>Final decision rests with Enqir.in management</li>
                    <li>If still unresolved, you may pursue legal recourse as per our Terms and Conditions and applicable Indian consumer protection laws</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">6. Contact Information</h2>
                  <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <p className="mb-1.5 sm:mb-2"><strong>For Refund Requests:</strong></p>
                    <p className="mb-2"><strong>Email:</strong> <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a></p>
                    <p className="mb-2"><strong>Support Email:</strong> <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a></p>
                    <p className="mb-2"><strong>Business Name:</strong> Enqir (Individual/Sole Proprietorship)</p>
                    <p className="mb-2"><strong>Owner Name:</strong> zeb</p>
                    <p className="mb-2"><strong>Owner Email:</strong> <a href="mailto:zebhere4@gmail.com" className="text-blue-600 hover:underline font-semibold">zebhere4@gmail.com</a></p>
                    <p className="mb-2 sm:mb-3"><strong>Response Time:</strong> Within 24-48 hours</p>
                    
                    <p className="mb-1.5 sm:mb-2"><strong>Required Information in Email:</strong></p>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                      <li>Subject: "Refund Request - [Transaction ID]"</li>
                      <li>Your registered email and name</li>
                      <li>Transaction ID and payment amount</li>
                      <li>Detailed reason for refund</li>
                      <li>Supporting screenshots/documents</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">7. Policy Updates</h2>
                  <p className="leading-relaxed">
                    We reserve the right to modify this Refund and Cancellation Policy at any time. Changes will be effective immediately upon posting on this page with an updated "Last Updated" date. Continued use of the Platform after changes constitutes acceptance. We will notify users of significant changes via email or Platform notification.
                  </p>
                </section>

                <section className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4 bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-1.5">📌 Important Reminder</h3>
                  <p className="text-[10px] sm:text-xs text-gray-700 leading-relaxed mb-1.5 sm:mb-2">
                    Enqir.in is a <strong>facilitator platform</strong> that connects buyers and sellers. We do not handle shipping, pricing, or transactions between users. Payment unlocks <strong>access to view seller responses</strong>, not guaranteed business outcomes or transaction success. We do not control seller content, quality, or availability. Please read all terms carefully before making a purchase.
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-700 leading-relaxed mb-1.5 sm:mb-2">
                    <strong>Shipping & Transactions:</strong> All shipping arrangements, pricing, and payment methods are negotiated directly between buyers and sellers via our chat feature. Enqir.in is not a party to these transactions and does not handle shipping or refunds for user-to-user transactions.
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-700 leading-relaxed">
                    <strong>Consumer Protection:</strong> This policy complies with the Consumer Protection (E-Commerce) Rules, 2020. We cannot refuse refunds for defective products or services not as described. All refunds for platform services are processed through our payment gateway to the original payment method.
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

