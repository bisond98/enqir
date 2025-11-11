import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, MessageSquare, Shield, CreditCard, AlertCircle, HelpCircle } from 'lucide-react';

const ContactUs = () => {
  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-4xl">
        <Card className="shadow-2xl border-0 overflow-hidden rounded-2xl sm:rounded-3xl">
          <CardHeader className="bg-gray-800 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">Contact Us</CardTitle>
            <p className="text-gray-300 mt-1 sm:mt-2 text-xs sm:text-sm">We're here to help! Reach out to us for any queries or support.</p>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 bg-white">
            <ScrollArea className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] md:h-[70vh] pr-2 sm:pr-4">
            <div className="space-y-6">
              
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  
                  <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all">
                    <CardHeader className="bg-blue-50">
                      <div className="flex items-center gap-3">
                        <Mail className="w-6 h-6 text-blue-600" />
                        <CardTitle className="text-lg">General Support</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-gray-700 mb-2">For general queries and assistance</p>
                      <a href="mailto:support@enqir.in" className="text-blue-600 hover:underline font-semibold text-lg">
                        support@enqir.in
                      </a>
                      <p className="text-sm text-gray-600 mt-2">Response time: 24-48 hours</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-green-200 hover:border-green-400 transition-all">
                    <CardHeader className="bg-green-50">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-green-600" />
                        <CardTitle className="text-lg">Payment & Refunds</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-gray-700 mb-2">For payment and refund issues</p>
                      <a href="mailto:refunds@enqir.in" className="text-green-600 hover:underline font-semibold text-lg">
                        refunds@enqir.in
                      </a>
                      <p className="text-sm text-gray-600 mt-2">Response time: 24 hours</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-purple-200 hover:border-purple-400 transition-all">
                    <CardHeader className="bg-purple-50">
                      <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-purple-600" />
                        <CardTitle className="text-lg">Privacy & Legal</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-gray-700 mb-2">For privacy and legal matters</p>
                      <a href="mailto:legal@enqir.in" className="text-purple-600 hover:underline font-semibold text-lg">
                        legal@enqir.in
                      </a>
                      <p className="text-sm text-gray-600 mt-2">Response time: 3-5 business days</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-cyan-200 hover:border-cyan-400 transition-all">
                    <CardHeader className="bg-cyan-50">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-6 h-6 text-cyan-600" />
                        <CardTitle className="text-lg">Data Privacy</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-gray-700 mb-2">For data protection requests</p>
                      <a href="mailto:privacy@enqir.in" className="text-cyan-600 hover:underline font-semibold text-lg">
                        privacy@enqir.in
                      </a>
                      <p className="text-sm text-gray-600 mt-2">Response time: 5-7 business days</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-red-200 hover:border-red-400 transition-all">
                    <CardHeader className="bg-red-50">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <CardTitle className="text-lg">Report Issues</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-gray-700 mb-2">Report fraud or abuse</p>
                      <a href="mailto:report@enqir.in" className="text-red-600 hover:underline font-semibold text-lg">
                        report@enqir.in
                      </a>
                      <p className="text-sm text-gray-600 mt-2">Response time: Immediate priority</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-yellow-200 hover:border-yellow-400 transition-all">
                    <CardHeader className="bg-yellow-50">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-6 h-6 text-yellow-600" />
                        <CardTitle className="text-lg">Disputes</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-gray-700 mb-2">For escalated disputes</p>
                      <a href="mailto:disputes@enqir.in" className="text-yellow-600 hover:underline font-semibold text-lg">
                        disputes@enqir.in
                      </a>
                      <p className="text-sm text-gray-600 mt-2">Response time: 2-3 business days</p>
                    </CardContent>
                  </Card>

                </div>
              </section>

              <section className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Business Information</h2>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Company Name:</strong> Enqir</p>
                  <p><strong>Website:</strong> <a href="https://enqir.in" className="text-purple-600 hover:underline">https://enqir.in</a></p>
                  <p><strong>Platform:</strong> AI-Powered Marketplace</p>
                  <p><strong>Service:</strong> Connecting Buyers with Sellers</p>
                </div>
              </section>

              <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Before You Email</h2>
                <p className="text-gray-700 mb-3">
                  To help us assist you faster, please include the following in your email:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Your registered email address</strong> on Enqir.in</li>
                  <li><strong>Transaction ID</strong> (for payment-related queries)</li>
                  <li><strong>Screenshots or evidence</strong> (if reporting an issue)</li>
                  <li><strong>Detailed description</strong> of your query or problem</li>
                  <li><strong>Date and time</strong> when the issue occurred (if applicable)</li>
                </ul>
              </section>

              <section className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">How long does it take to get a response?</h3>
                    <p className="text-gray-600 text-sm">Most queries are answered within 24-48 hours. Payment and refund queries are prioritized and answered within 24 hours.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Can I call for support?</h3>
                    <p className="text-gray-600 text-sm">Currently, we only provide email support. This helps us maintain detailed records and provide better assistance.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">What if my issue is urgent?</h3>
                    <p className="text-gray-600 text-sm">For payment failures or technical errors, email <a href="mailto:support@enqir.in" className="text-blue-600 hover:underline">support@enqir.in</a> with "URGENT" in the subject line.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">How do I track my refund status?</h3>
                    <p className="text-gray-600 text-sm">After submitting a refund request, you'll receive a tracking number. Email <a href="mailto:refunds@enqir.in" className="text-blue-600 hover:underline">refunds@enqir.in</a> with your tracking number for updates.</p>
                  </div>
                </div>
              </section>

              <section className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border-2 border-indigo-300">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">📧 Email Template for Refund Requests</h2>
                <div className="bg-white p-4 rounded border border-gray-200 font-mono text-sm text-gray-700">
                  <p><strong>Subject:</strong> Refund Request - [Your Transaction ID]</p>
                  <p className="mt-2"><strong>Body:</strong></p>
                  <p className="mt-1">- Full Name: [Your Name]</p>
                  <p>- Registered Email: [Your Email]</p>
                  <p>- Transaction ID: [e.g., TXN123456789]</p>
                  <p>- Payment Amount: ₹[Amount]</p>
                  <p>- Payment Date: [DD/MM/YYYY]</p>
                  <p>- Reason for Refund: [Detailed explanation]</p>
                  <p>- Attachments: [Payment screenshot, issue screenshot]</p>
                </div>
              </section>

              <section className="text-center text-gray-600 text-sm border-t pt-4">
                <p>
                  For policy details, please review our{' '}
                  <a href="/terms-and-conditions" className="text-purple-600 hover:underline font-semibold">Terms and Conditions</a>,{' '}
                  <a href="/privacy-policy" className="text-purple-600 hover:underline font-semibold">Privacy Policy</a>, and{' '}
                  <a href="/refund-policy" className="text-purple-600 hover:underline font-semibold">Refund Policy</a>.
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

export default ContactUs;

