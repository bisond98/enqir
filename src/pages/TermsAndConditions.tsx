import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const TermsAndConditions = () => {
  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-4xl">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardHeader className="bg-gray-800 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">Terms and Conditions</CardTitle>
            <p className="text-gray-300 mt-1 sm:mt-2 text-xs sm:text-sm">Last Updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 bg-white">
            <ScrollArea className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] md:h-[70vh] pr-2 sm:pr-4">
              <div className="space-y-3 sm:space-y-4 md:space-y-6 text-gray-700 text-xs sm:text-sm md:text-base leading-relaxed">
                
                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">1. Acceptance of Terms</h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed">
                    Welcome to Enqir.in ("we," "our," "us," or "the Platform"). By accessing or using our AI-powered marketplace platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
                  </p>
                  <p className="leading-relaxed">
                    These terms constitute a legally binding agreement between you and Enqir.in. We reserve the right to update these terms at any time, and continued use of the Platform constitutes acceptance of any changes. Significant changes will be notified via email or Platform notification.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">2. Service Description</h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed">
                    Enqir.in is an AI-powered marketplace platform that facilitates connections between buyers and sellers. We provide the following services:
                  </p>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                    <li><strong>Free Enquiry Posting:</strong> Users can post unlimited buying enquiries at no cost</li>
                    <li><strong>Seller Response Platform:</strong> Sellers can submit responses to enquiries</li>
                    <li><strong>AI-Powered Matching:</strong> Smart algorithms match buyers with relevant sellers</li>
                    <li><strong>Freemium Response Access:</strong> Payment plans unlock access to seller responses</li>
                    <li><strong>Commission-Free Trading:</strong> Direct connections between buyers and sellers without platform commissions on transactions</li>
                  </ul>
                  <p className="mt-2 sm:mt-3 text-sm text-gray-600 italic">
                    <strong>Note:</strong> We are a facilitator connecting buyers and sellers. We are not a party to transactions between users and do not control seller content, quality, or availability.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">3. User Accounts</h2>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2">3.1 Registration and Eligibility</h3>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mb-2 sm:mb-3 leading-relaxed">
                    <li>You must be at least <strong>18 years old</strong> to use this Platform. If you are under 18, you must have parental or guardian consent</li>
                    <li>You must provide accurate, complete, and truthful information during registration</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>You agree to notify us immediately of any unauthorized use of your account</li>
                    <li>You represent and warrant that all information provided is true and current</li>
                  </ul>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2">3.2 Account Responsibilities</h3>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                    <li>You are solely responsible for all activities under your account</li>
                    <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
                    <li>One user may not maintain multiple accounts without prior written approval</li>
                    <li>You must keep your account information up to date</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">4. Payment Terms</h2>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2">4.1 Payment Plans</h3>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-2 sm:mb-3">
                    <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base">
                      <li><strong>Free Plan:</strong> ₹0 - Access to 2 seller responses per enquiry</li>
                      <li><strong>Basic Plan:</strong> ₹99 - Unlock 5 seller responses per enquiry</li>
                      <li><strong>Standard Plan:</strong> ₹199 - Unlock 10 seller responses per enquiry</li>
                      <li><strong>Premium Plan:</strong> ₹499 - Unlock unlimited responses for one enquiry</li>
                    </ul>
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2">4.2 Payment Processing</h3>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mb-2 sm:mb-3 leading-relaxed">
                    <li>All payments are processed securely through <strong>third-party payment gateways</strong> and trusted payment partners</li>
                    <li>We accept Credit Cards, Debit Cards, UPI, Net Banking, and Digital Wallets</li>
                    <li>All prices are in Indian Rupees (INR) and include applicable taxes (GST as applicable)</li>
                    <li>Payment must be completed before accessing seller responses</li>
                    <li>We do not store your payment card information. Sensitive financial data is handled securely by our payment gateway partners</li>
                    <li>By using our payment services, you agree to the terms and privacy policies of our payment partners. Please review their policies:
                      <ul className="list-disc pl-5 sm:pl-6 mt-1.5 space-y-1">
                        <li><a href="https://razorpay.com/terms/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-semibold">Payment Gateway Terms</a></li>
                        <li><a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-semibold">Payment Gateway Privacy Policy</a></li>
                      </ul>
                    </li>
                  </ul>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2">4.3 Billing</h3>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                    <li>You will be charged immediately upon selecting a payment plan</li>
                    <li>All sales are final once payment is confirmed and service is activated</li>
                    <li>Digital invoices are provided via email after successful payment</li>
                    <li>All payment obligations related to your purchases remain your sole responsibility</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">5. Refund and Cancellation Policy</h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed text-sm sm:text-base">
                    Our refund and cancellation policy is designed to comply with the Consumer Protection (E-Commerce) Rules, 2020. Please review our detailed <a href="/refund-policy" className="text-purple-600 hover:underline font-semibold">Refund and Cancellation Policy</a> for complete information.
                  </p>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2">5.1 Refund Eligibility</h3>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mb-2 sm:mb-3 leading-relaxed">
                    <li><strong>Technical Errors:</strong> Full refund if payment is deducted but service not activated due to technical failure</li>
                    <li><strong>Defective Service:</strong> Full refund if service is defective or not as described (mandatory under Indian consumer protection laws)</li>
                    <li><strong>Duplicate Payments:</strong> Full refund for accidental duplicate charges</li>
                    <li><strong>Service Not Delivered:</strong> Full refund if responses are not unlocked after successful payment</li>
                    <li><strong>Within 24 Hours:</strong> Refund requests for digital services must be raised within 24 hours of payment</li>
                    <li><strong>Within 15 Days:</strong> For physical products (if any), return requests must be made within 15 days of delivery</li>
                  </ul>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2">5.2 Non-Refundable Scenarios</h3>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mb-2 sm:mb-3 leading-relaxed">
                    <li>Change of mind after viewing unlocked responses</li>
                    <li>Dissatisfaction with seller response quality or content</li>
                    <li>Failure to receive seller responses (sellers are independent third parties)</li>
                    <li>Account suspension or termination due to Terms violation</li>
                  </ul>
                  
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1.5 sm:mb-2">5.3 Refund Process</h3>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                    <li>Refund requests must be sent to support@enqir.in with transaction details</li>
                    <li>Refunds are processed within 5-10 business days after approval</li>
                    <li>Refunds are credited to the original payment method through our payment gateway</li>
                    <li>Refund processing time may vary depending on your bank (typically 3-10 business days)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">6. User Conduct and Prohibited Activities</h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed">You agree NOT to:</p>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                    <li>Post false, misleading, or fraudulent enquiries</li>
                    <li>Harass, abuse, threaten, or harm other users</li>
                    <li>Use the Platform for illegal activities or violate any applicable laws</li>
                    <li>Circumvent payment systems or attempt fraud</li>
                    <li>Scrape, copy, or misuse Platform data without authorization</li>
                    <li>Impersonate other users, entities, or organizations</li>
                    <li>Upload malicious code, viruses, malware, or harmful content</li>
                    <li>Spam, send unsolicited communications, or engage in bulk messaging</li>
                    <li>Violate intellectual property rights of others</li>
                    <li>Manipulate AI systems, abuse platform features, or attempt to game the system</li>
                    <li>Interfere with or disrupt the Platform's security, servers, or networks</li>
                    <li>Collect or harvest personal information of other users without consent</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">7. AI and Content Moderation</h2>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                    <li>Our AI systems automatically review and approve enquiries and responses</li>
                    <li>We reserve the right to reject content that violates our policies or applicable laws</li>
                    <li>AI-powered matching is provided on a best-effort basis</li>
                    <li>We do not guarantee specific matching results, response quality, or seller availability</li>
                    <li>Image recognition features process uploaded images using AI technology</li>
                    <li>Content moderation decisions are at our sole discretion</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">8. Intellectual Property</h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed">
                    All content on Enqir.in, including but not limited to logos, designs, text, graphics, AI algorithms, software, trademarks, and service marks, is owned by Enqir.in or licensed to us. You may not reproduce, distribute, modify, create derivative works, publicly display, or commercially exploit any of our content without our prior written permission.
                  </p>
                  <p className="leading-relaxed">
                    User-generated content (enquiries, responses, images, messages) remains the property of the respective users. However, by posting content on our Platform, you grant us a non-exclusive, worldwide, royalty-free, perpetual license to use, display, reproduce, distribute, and process this content for Platform operations, including but not limited to matching, moderation, and display to other users.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">9. Limitation of Liability</h2>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mb-2 sm:mb-3 leading-relaxed">
                    <li><strong>Platform Role:</strong> Enqir.in is a facilitator connecting buyers and sellers. We are not a party to transactions between users and do not control seller content, quality, or availability</li>
                    <li><strong>No Guarantees:</strong> We do not guarantee the accuracy, reliability, completeness, or quality of user-generated content, seller responses, or matching results</li>
                    <li><strong>Third-Party Actions:</strong> We are not liable for actions, products, services, or conduct of sellers, buyers, or other users</li>
                    <li><strong>Third-Party Services:</strong> We are not responsible for the terms, practices, or policies of third-party service providers, including payment gateways. We are not an agent or representative of payment gateway providers</li>
                    <li><strong>Maximum Liability:</strong> Our liability is limited to the amount you paid for the specific service in question</li>
                    <li><strong>Indirect Damages:</strong> We are not liable for indirect, incidental, special, consequential, or punitive damages, including but not limited to lost profits, lost data, or business interruption</li>
                    <li><strong>Service Interruptions:</strong> We are not liable for any interruptions, errors, or defects in the Platform</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">10. Disclaimer of Warranties</h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed font-semibold">
                    THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT:
                  </p>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                    <li>The Platform will be uninterrupted, secure, or error-free</li>
                    <li>Results obtained from the Platform will be accurate, reliable, or meet your expectations</li>
                    <li>Any defects or errors will be corrected</li>
                    <li>AI features will meet your specific expectations or requirements</li>
                    <li>The Platform is free from viruses, malware, or other harmful components</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">11. Data Privacy</h2>
                  <p className="leading-relaxed">
                    Your privacy is important to us. Please review our <a href="/privacy-policy" className="text-purple-600 hover:underline font-semibold">Privacy Policy</a> to understand how we collect, use, disclose, and protect your personal information. By using the Platform, you consent to our data practices as described in the Privacy Policy.
                  </p>
                  <p className="mt-2 leading-relaxed">
                    We may share your information with third-party service providers, including payment gateways, to process payments, prevent fraud, and comply with legal requirements. Please review our Privacy Policy for detailed information about data sharing.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">12. Termination</h2>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                    <li>You may terminate your account at any time by contacting support at support@enqir.in</li>
                    <li>We may suspend or terminate your account immediately for Terms violations, illegal activities, or fraudulent behavior</li>
                    <li>Upon termination, your access to all Platform features, including paid features, will cease immediately</li>
                    <li>No refunds are provided for account termination due to violations of these Terms</li>
                    <li>Certain provisions survive termination, including payment obligations, intellectual property rights, limitation of liability, and dispute resolution clauses</li>
                    <li>We reserve the right to delete your account data after termination, subject to legal retention requirements</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">13. Third-Party Services</h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed">
                    Our Platform uses third-party service providers for certain functions, including payment processing, hosting, and analytics. We acknowledge the involvement of these third-party service providers and state that:
                  </p>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mb-2 sm:mb-3 leading-relaxed">
                    <li>We are not responsible for the terms, practices, or policies of third-party service providers</li>
                    <li>By using our services, you agree to the terms and privacy policies of our third-party partners, including payment gateway providers</li>
                    <li>We do not act as an agent or representative of any third-party service provider</li>
                    <li>All obligations related to our products, services, delivery, after-sales support, and customer inquiries remain our sole responsibility</li>
                    <li>Third-party service providers have their own terms and privacy policies, which you should review independently</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">14. Governing Law and Dispute Resolution</h2>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                    <li>These Terms are governed by the laws of India and are subject to the exclusive jurisdiction of courts in India</li>
                    <li>Any disputes, controversies, or claims arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of courts in Palakkad, Kerala, India</li>
                    <li>You agree to attempt good-faith resolution through direct communication with our support team before initiating legal action</li>
                    <li>Disputes may be resolved through negotiation, mediation, or arbitration as mutually agreed</li>
                    <li>These Terms are subject to the Consumer Protection Act, 2019, and the Consumer Protection (E-Commerce) Rules, 2020</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">15. Our Responsibilities</h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed">
                    We emphasize that all obligations related to our products and services remain our sole responsibility:
                  </p>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 leading-relaxed">
                    <li><strong>Service Delivery:</strong> We are responsible for delivering the services as described in these Terms</li>
                    <li><strong>Customer Support:</strong> All customer inquiries, support requests, and after-sales support are handled by us</li>
                    <li><strong>Dispute Resolution:</strong> We handle all disputes related to our services, products, and Platform operations</li>
                    <li><strong>Refund Processing:</strong> We are responsible for processing refunds in accordance with our Refund Policy</li>
                    <li><strong>Platform Operations:</strong> We maintain and operate the Platform, including all features and services</li>
                    <li><strong>Privacy and Security:</strong> We are responsible for protecting user data and maintaining Platform security</li>
                  </ul>
                  <p className="mt-2 sm:mt-3 leading-relaxed text-sm sm:text-base">
                    While we use third-party service providers for payment processing and other functions, all customer-facing responsibilities, including delivery, support, and dispute resolution, remain our sole responsibility.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">16. Grievance Officer</h2>
                  <p className="mb-2 sm:mb-3 leading-relaxed">
                    In accordance with the Information Technology Act, 2000 and Consumer Protection (E-Commerce) Rules, 2020, we have appointed a Grievance Officer to address your concerns:
                  </p>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border-l-4 border-purple-500">
                    <p className="mb-2"><strong>Name:</strong> Nived Sunil S</p>
                    <p className="mb-2"><strong>Email:</strong> <a href="mailto:info@enqir.in" className="text-purple-600 hover:underline font-semibold">info@enqir.in</a></p>
                    <p className="mb-2"><strong>Phone:</strong> +91 9747460245</p>
                    <p className="mb-2"><strong>Address:</strong> Kunnath house, Thenkara Po Mannarkkad, Palakkad, Kerala</p>
                    <p className="text-sm text-gray-600 mt-2"><strong>Response Time:</strong> We will respond to your grievance within 24-48 hours</p>
                  </div>
                  <p className="mt-2 sm:mt-3 text-sm text-gray-600 leading-relaxed">
                    For any complaints, grievances, or concerns regarding the Platform, services, or these Terms, please contact our Grievance Officer with detailed information including your registered email, transaction ID (if applicable), and description of the issue.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">17. Modifications to Terms</h2>
                  <p className="leading-relaxed">
                    We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting on this page with an updated "Last Updated" date. Your continued use of the Platform after changes constitutes acceptance of the modified Terms. We will notify users of significant changes via email or Platform notification. It is your responsibility to review these Terms periodically for any updates.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">18. Contact Information</h2>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <p className="mb-2"><strong>Business Name:</strong> Enqir (Individual/Sole Proprietorship)</p>
                    <p className="mb-2"><strong>Owner Name:</strong> Nived Sunil S</p>
                    <p className="mb-2"><strong>Owner Email:</strong> <a href="mailto:nivedsunil5@gmail.com" className="text-purple-600 hover:underline font-semibold">nivedsunil5@gmail.com</a></p>
                    <p className="mb-2"><strong>Email:</strong> <a href="mailto:info@enqir.in" className="text-purple-600 hover:underline font-semibold">info@enqir.in</a></p>
                    <p className="mb-2"><strong>Support Email:</strong> <a href="mailto:info@enqir.in" className="text-purple-600 hover:underline font-semibold">info@enqir.in</a></p>
                    <p className="mb-2"><strong>Phone:</strong> +91 9747460245</p>
                    <p className="mb-2"><strong>Physical Address:</strong> Kunnath house, Thenkara Po Mannarkkad, Palakkad, Kerala</p>
                    <p className="mb-2"><strong>Website:</strong> <a href="https://enqir.in" className="text-purple-600 hover:underline font-semibold">https://enqir.in</a></p>
                  </div>
                  <p className="mt-3 sm:mt-4 text-sm text-gray-600 leading-relaxed">
                    For payment-related queries, refund requests, or billing issues, please contact our support team at info@enqir.in with your transaction ID and registered email address. Response time: Within 24-48 hours.
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

