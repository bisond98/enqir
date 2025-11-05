import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Lock, Eye, Database, UserCheck, Bell } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
              <div>
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">Privacy Policy</CardTitle>
                <p className="text-blue-100 mt-2 text-xs sm:text-sm">Last Updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ScrollArea className="h-[calc(100vh-8rem)] sm:h-[70vh] pr-2 sm:pr-4">
              <div className="space-y-4 sm:space-y-6 text-gray-700 text-sm sm:text-base">
                
                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    1. Introduction
                  </h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed">
                    Welcome to Enqir.in ("we," "our," "us," or "the Platform"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our AI-powered marketplace platform.
                  </p>
                  <p className="leading-relaxed">
                    By using Enqir.in, you explicitly consent to the collection, use, and disclosure of information in accordance with this Privacy Policy. If you do not agree with our policies, please do not use our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Database className="w-6 h-6 text-blue-600" />
                    2. Information We Collect
                  </h2>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2.1 Information You Provide Directly</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                    <li><strong>Profile Information:</strong> Display name, profile picture, bio, business details</li>
                    <li><strong>Enquiry Information:</strong> Product/service descriptions, categories, budgets, deadlines, location preferences</li>
                    <li><strong>Response Information:</strong> Seller submissions, quotes, contact details, business proposals</li>
                    <li><strong>Payment Information:</strong> Billing address, transaction history, payment method details (payment card details are processed by third-party payment gateways and not stored by us)</li>
                    <li><strong>Communication Data:</strong> Messages, chat history, feedback, support tickets</li>
                    <li><strong>Verification Data:</strong> Identity documents, business registration details (for verified users)</li>
                    <li><strong>Images:</strong> Photos uploaded for enquiries or responses</li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2.2 Information Collected Automatically</h3>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
                    <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, click patterns</li>
                    <li><strong>Location Data:</strong> Approximate location based on IP address (with your consent)</li>
                    <li><strong>Cookies and Tracking:</strong> Session data, preferences, authentication tokens</li>
                    <li><strong>AI Interaction Data:</strong> Search queries, AI recommendation interactions, matchmaking patterns</li>
                  </ul>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2">2.3 Information from Third Parties</h3>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                    <li><strong>Payment Processors:</strong> Transaction confirmations, payment status, and transaction details from third-party payment gateways</li>
                    <li><strong>Authentication Providers:</strong> Firebase Authentication data</li>
                    <li><strong>Cloud Services:</strong> Image storage metadata from Cloudinary</li>
                    <li><strong>Analytics Services:</strong> Aggregated usage insights</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Lock className="w-6 h-6 text-blue-600" />
                    3. How We Use Your Information
                  </h2>
                  
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Core Platform Functions</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Create and manage your account</li>
                      <li>Process and display your enquiries and responses</li>
                      <li>Facilitate connections between buyers and sellers</li>
                      <li>Process payments and manage subscriptions</li>
                      <li>Provide customer support</li>
                      <li>Send transactional emails and notifications</li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">AI-Powered Features</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Approve and moderate enquiries using AI content analysis</li>
                      <li>Match buyers with relevant sellers using smart algorithms</li>
                      <li>Provide personalized recommendations</li>
                      <li>Detect and prevent spam, fraud, and abuse</li>
                      <li>Analyze images using computer vision technology</li>
                      <li>Generate insights and analytics</li>
                    </ul>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Other Uses</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Improve and optimize our Platform features</li>
                    <li>Conduct research and analytics</li>
                    <li>Send marketing communications (with your consent)</li>
                    <li>Comply with legal obligations</li>
                    <li>Enforce our Terms and Conditions</li>
                    <li>Protect against security threats</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">4. Information Sharing and Disclosure</h2>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2">4.1 When We Share Your Information</h3>
                  <p className="mb-2 sm:mb-3 leading-relaxed text-sm sm:text-base">
                    We may share your information with third parties in the following circumstances:
                  </p>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 leading-relaxed">
                    <li><strong>With Other Users:</strong> Your enquiries and responses are visible to relevant users based on matchmaking</li>
                    <li><strong>Payment Processing:</strong> We share customer information (name, email, address, transaction details) with <strong>third-party payment processors</strong> (financial institutions, banks, payment gateways) to process payments, track transactions, prevent fraud, and comply with legal requirements. <strong>By using our payment services, you explicitly consent to sharing your information with payment processors and their affiliates.</strong></li>
                    <li><strong>Service Providers:</strong> Third-party services for hosting (Firebase, Supabase), image storage (Cloudinary), and analytics</li>
                    <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                    <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
                    <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
                  </ul>
                  
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-500 mb-3 sm:mb-4">
                    <h4 className="font-semibold text-gray-800 mb-1.5 sm:mb-2">Payment Gateway Data Sharing</h4>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-2">
                      When you make a payment, we share the following information with our payment gateway partners:
                    </p>
                    <ul className="list-disc pl-5 sm:pl-6 space-y-1 text-xs sm:text-sm text-gray-700 leading-relaxed">
                      <li>Your name and email address</li>
                      <li>Billing address</li>
                      <li>Transaction amount and details</li>
                      <li>Payment method information (card type, last 4 digits - not full card numbers)</li>
                    </ul>
                    <p className="mt-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
                      <strong>Important:</strong> Sensitive financial information (full card numbers, CVV, expiry dates) is handled securely by the payment gateway and adheres to industry standards like PCI-DSS. We or the payment gateway do not store your card data on our servers. The data is encrypted through secure protocols.
                    </p>
                    <p className="mt-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
                      <strong>Consent:</strong> By proceeding with a payment, you explicitly consent to sharing your information with payment processors and their affiliates for the purposes stated above.
                    </p>
                    <p className="mt-2 text-xs sm:text-sm">
                      <strong>Review Payment Gateway Privacy:</strong> Please review the privacy policy of our payment gateway: <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Payment Gateway Privacy Policy</a>
                    </p>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2">4.2 What We DON'T Share</h3>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                    <li>We never sell your personal information to third parties</li>
                    <li>Payment card details (full card numbers, CVV) are never stored or shared by us (handled securely by payment gateways)</li>
                    <li>Private messages are not shared with advertisers</li>
                    <li>Identity verification documents are kept confidential</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                    5. Your Privacy Rights
                  </h2>
                  <p className="mb-3">You have the following rights regarding your personal data:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and data (subject to legal retention)</li>
                    <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                    <li><strong>Objection:</strong> Opt-out of marketing communications</li>
                    <li><strong>Restriction:</strong> Request limitation of data processing</li>
                    <li><strong>Withdrawal:</strong> Withdraw consent for data processing (where applicable)</li>
                  </ul>
                  <p className="mt-3">
                    To exercise these rights, contact us at <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a>
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    6. Data Security
                  </h2>
                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                    <p className="mb-2 sm:mb-3 leading-relaxed">We implement industry-standard security measures to protect your data:</p>
                    <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                      <li><strong>Encryption:</strong> HTTPS/TLS encryption for data in transit</li>
                      <li><strong>Firebase Security:</strong> Secure authentication and database rules</li>
                      <li><strong>Payment Gateway Security:</strong> Payment processing through PCI-DSS compliant payment gateways. Sensitive financial information (card data) is handled securely by payment gateway partners adhering to industry standards like PCI-DSS</li>
                      <li><strong>No Card Storage:</strong> We or our payment gateway partners do not store your card data on our servers. Payment card details are encrypted and processed securely</li>
                      <li><strong>Access Controls:</strong> Restricted employee access to sensitive data</li>
                      <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                      <li><strong>Monitoring:</strong> Real-time threat detection and response</li>
                      <li><strong>Backup:</strong> Regular data backups for disaster recovery</li>
                    </ul>
                  </div>
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                    <strong>Note:</strong> No system is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. We recommend using strong passwords and keeping your account credentials secure.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
                    <li><strong>Deleted Accounts:</strong> Most data deleted within 30 days of account deletion</li>
                    <li><strong>Legal Requirements:</strong> Some data retained for 7 years for tax/legal compliance</li>
                    <li><strong>Anonymized Data:</strong> Aggregated analytics may be retained indefinitely</li>
                    <li><strong>Payment Records:</strong> Transaction history retained for accounting and dispute resolution</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Cookies and Tracking Technologies</h2>
                  <p className="mb-3">We use cookies and similar technologies for:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li><strong>Essential Cookies:</strong> Authentication, security, session management</li>
                    <li><strong>Functional Cookies:</strong> Remember preferences and settings</li>
                    <li><strong>Analytics Cookies:</strong> Understand user behavior and improve services</li>
                    <li><strong>Marketing Cookies:</strong> Personalized advertising (with consent)</li>
                  </ul>
                  <p>
                    You can control cookies through your browser settings. Blocking cookies may limit Platform functionality.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-blue-600" />
                    9. Marketing Communications
                  </h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>We may send promotional emails about new features, offers, and updates</li>
                    <li>You can opt-out of marketing emails by clicking "Unsubscribe" in any email</li>
                    <li>Transactional emails (payment confirmations, security alerts) cannot be opted out</li>
                    <li>Push notifications can be disabled in your device settings</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Children's Privacy</h2>
                  <p>
                    Enqir.in is not intended for users under 18 years of age. We do not knowingly collect data from children. If you believe we have inadvertently collected information from a child, contact us immediately at <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline">info@enqir.in</a>, and we will delete it.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. International Data Transfers</h2>
                  <p className="mb-3">
                    Your data is primarily stored in India. If data is transferred internationally, we ensure adequate safeguards are in place, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Standard Contractual Clauses (SCCs)</li>
                    <li>Data Processing Agreements with vendors</li>
                    <li>Compliance with applicable data protection laws</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">12. Third-Party Services</h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed">We integrate with third-party services that have their own privacy policies. By using our Platform, you agree to the terms and privacy policies of these third-party service providers:</p>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mb-2 sm:mb-3 leading-relaxed">
                    <li><strong>Firebase:</strong> <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Privacy Policy</a></li>
                    <li><strong>Payment Gateway:</strong> <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Payment Gateway Privacy Policy</a> and <a href="https://razorpay.com/terms/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Terms</a></li>
                    <li><strong>Cloudinary:</strong> <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Privacy Policy</a></li>
                    <li><strong>Supabase:</strong> <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Privacy Policy</a></li>
                  </ul>
                  <p className="leading-relaxed text-sm sm:text-base">
                    We are not responsible for third-party privacy practices. Please review their policies independently. We do not act as an agent or representative of any third-party service provider.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Changes to Privacy Policy</h2>
                  <p>
                    We may update this Privacy Policy periodically. Changes will be posted on this page with an updated "Last Updated" date. Significant changes will be notified via email or Platform notification. Continued use after changes constitutes acceptance.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">14. Contact Us</h2>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <p className="mb-2 sm:mb-3 leading-relaxed">For privacy-related questions, concerns, or requests, contact us:</p>
                    <p className="mb-2"><strong>Privacy Officer / Grievance Officer</strong></p>
                    <p className="mb-2"><strong>Name:</strong> Nived Sunil S</p>
                    <p className="mb-2"><strong>Business Name:</strong> Enqir (Individual/Sole Proprietorship)</p>
                    <p className="mb-2"><strong>Owner Name:</strong> Nived Sunil S</p>
                    <p className="mb-2"><strong>Email:</strong> <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a></p>
                    <p className="mb-2"><strong>Grievance Email:</strong> <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a></p>
                    <p className="mb-2"><strong>Support Email:</strong> <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a></p>
                    <p className="mb-2"><strong>Phone:</strong> +91 9747460245</p>
                    <p className="mb-2"><strong>Physical Address:</strong> Kunnath house, Thenkara Po Mannarkkad, Palakkad, Kerala</p>
                    <p className="mb-2"><strong>Website:</strong> <a href="https://enqir.in" className="text-blue-600 hover:underline font-semibold">https://enqir.in</a></p>
                    <p className="mt-2 text-xs sm:text-sm text-gray-600"><strong>Response Time:</strong> Within 24-48 hours</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">15. Compliance</h2>
                  <p>
                    We comply with applicable data protection laws, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-3">
                    <li>Information Technology Act, 2000 (India)</li>
                    <li>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</li>
                    <li>General Data Protection Regulation (GDPR) principles for international users</li>
                  </ul>
                </section>

                <section className="border-t pt-6 mt-6">
                  <p className="text-sm text-gray-600 italic">
                    By using Enqir.in, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and disclosure of your information as described herein.
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

export default PrivacyPolicy;

