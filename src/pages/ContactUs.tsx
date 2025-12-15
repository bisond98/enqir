import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, MessageSquare, Shield, CreditCard, AlertCircle, HelpCircle } from 'lucide-react';

const ContactUs = () => {
  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-4xl">
        <Card className="shadow-2xl border-0 overflow-hidden rounded-none">
          <CardHeader className="bg-black p-2 sm:p-3 md:p-4">
            <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-white">Contact Us</CardTitle>
            <p className="text-gray-300 mt-0.5 sm:mt-1 text-[10px] sm:text-xs">We're here to help! Reach out to us for any queries or support.</p>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 md:p-4 bg-white">
            <ScrollArea className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] md:h-[70vh] pr-2 sm:pr-4">
            <div className="space-y-3 sm:space-y-4">
              
              <section>
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Get in Touch</h2>
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                  
                  <Card className="border-[0.5px] border-black hover:border-gray-800 transition-all rounded-none shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
                    <CardHeader className="bg-white p-2 sm:p-3 border-b-[0.5px] border-black">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                        <CardTitle className="text-xs sm:text-sm md:text-base text-black font-black">General Support</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 sm:pt-3 p-2 sm:p-3 bg-white">
                      <p className="text-[10px] sm:text-xs text-gray-700 mb-1.5 font-medium">For general queries and assistance</p>
                      <a href="mailto:info@enqir.in" className="text-black hover:underline font-black text-xs sm:text-sm md:text-base">
                        info@enqir.in
                      </a>
                      <p className="text-[10px] sm:text-xs text-gray-600 mt-1.5 font-medium">Response time: 24-48 hours</p>
                    </CardContent>
                  </Card>

                  <Card className="border-[0.5px] border-black hover:border-gray-800 transition-all rounded-none shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
                    <CardHeader className="bg-white p-2 sm:p-3 border-b-[0.5px] border-black">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0" />
                        <CardTitle className="text-xs sm:text-sm md:text-base text-black font-black">Payment & Refunds</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 sm:pt-3 p-2 sm:p-3 bg-white">
                      <p className="text-[10px] sm:text-xs text-gray-700 mb-1.5 font-medium">For payment and refund issues</p>
                      <a href="mailto:info@enqir.in" className="text-black hover:underline font-black text-xs sm:text-sm md:text-base">
                        info@enqir.in
                      </a>
                      <p className="text-[10px] sm:text-xs text-gray-600 mt-1.5 font-medium">Response time: 24 hours</p>
                    </CardContent>
                  </Card>

                  <Card className="border-[0.5px] border-black hover:border-gray-800 transition-all rounded-none shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
                    <CardHeader className="bg-white p-2 sm:p-3 border-b-[0.5px] border-black">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                        <CardTitle className="text-xs sm:text-sm md:text-base text-black font-black">Privacy & Legal</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 sm:pt-3 p-2 sm:p-3 bg-white">
                      <p className="text-[10px] sm:text-xs text-gray-700 mb-1.5 font-medium">For privacy and legal matters</p>
                      <a href="mailto:info@enqir.in" className="text-black hover:underline font-black text-xs sm:text-sm md:text-base">
                        info@enqir.in
                      </a>
                      <p className="text-[10px] sm:text-xs text-gray-600 mt-1.5 font-medium">Response time: 3-5 business days</p>
                    </CardContent>
                  </Card>

                  <Card className="border-[0.5px] border-black hover:border-gray-800 transition-all rounded-none shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
                    <CardHeader className="bg-white p-2 sm:p-3 border-b-[0.5px] border-black">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                        <CardTitle className="text-xs sm:text-sm md:text-base text-black font-black">Data Privacy</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 sm:pt-3 p-2 sm:p-3 bg-white">
                      <p className="text-[10px] sm:text-xs text-gray-700 mb-1.5 font-medium">For data protection requests</p>
                      <a href="mailto:info@enqir.in" className="text-black hover:underline font-black text-xs sm:text-sm md:text-base">
                        info@enqir.in
                      </a>
                      <p className="text-[10px] sm:text-xs text-gray-600 mt-1.5 font-medium">Response time: 5-7 business days</p>
                    </CardContent>
                  </Card>

                  <Card className="border-[0.5px] border-black hover:border-gray-800 transition-all rounded-none shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
                    <CardHeader className="bg-white p-2 sm:p-3 border-b-[0.5px] border-black">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                        <CardTitle className="text-xs sm:text-sm md:text-base text-black font-black">Report Issues</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 sm:pt-3 p-2 sm:p-3 bg-white">
                      <p className="text-[10px] sm:text-xs text-gray-700 mb-1.5 font-medium">Report fraud or abuse</p>
                      <a href="mailto:info@enqir.in" className="text-black hover:underline font-black text-xs sm:text-sm md:text-base">
                        info@enqir.in
                      </a>
                      <p className="text-[10px] sm:text-xs text-gray-600 mt-1.5 font-medium">Response time: Immediate priority</p>
                    </CardContent>
                  </Card>

                  <Card className="border-[0.5px] border-black hover:border-gray-800 transition-all rounded-none shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer">
                    <CardHeader className="bg-white p-2 sm:p-3 border-b-[0.5px] border-black">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                        <CardTitle className="text-xs sm:text-sm md:text-base text-black font-black">Disputes</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 sm:pt-3 p-2 sm:p-3 bg-white">
                      <p className="text-[10px] sm:text-xs text-gray-700 mb-1.5 font-medium">For escalated disputes</p>
                      <a href="mailto:info@enqir.in" className="text-black hover:underline font-black text-xs sm:text-sm md:text-base">
                        info@enqir.in
                      </a>
                      <p className="text-[10px] sm:text-xs text-gray-600 mt-1.5 font-medium">Response time: 2-3 business days</p>
                    </CardContent>
                  </Card>

                </div>
              </section>

              <section className="bg-white p-2 sm:p-3 rounded-none border-[0.5px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]">
                <h2 className="text-sm sm:text-base md:text-lg font-black text-black mb-2">Business Information</h2>
                <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs text-gray-700">
                  <p><strong>Company Name:</strong> Enqir</p>
                  <p><strong>Owner Name:</strong> zeb</p>
                  <p><strong>Owner Email:</strong> <a href="mailto:zebhere4@gmail.com" className="text-black hover:underline">zebhere4@gmail.com</a></p>
                  <p><strong>Website:</strong> <a href="https://enqir.in" className="text-black hover:underline">https://enqir.in</a></p>
                  <p><strong>Platform:</strong> AI-Powered Marketplace</p>
                  <p><strong>Service:</strong> Connecting Buyers with Sellers</p>
                </div>
              </section>

              <section className="bg-white p-2 sm:p-3 rounded-none border-[0.5px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]">
                <h2 className="text-sm sm:text-base md:text-lg font-black text-black mb-2">Before You Email</h2>
                <p className="text-[10px] sm:text-xs text-gray-700 mb-2">
                  To help us assist you faster, please include the following in your email:
                </p>
                <ul className="list-disc pl-4 sm:pl-5 space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs text-gray-700">
                  <li><strong>Your registered email address</strong> on Enqir.in</li>
                  <li><strong>Transaction ID</strong> (for payment-related queries)</li>
                  <li><strong>Screenshots or evidence</strong> (if reporting an issue)</li>
                  <li><strong>Detailed description</strong> of your query or problem</li>
                  <li><strong>Date and time</strong> when the issue occurred (if applicable)</li>
                </ul>
              </section>

              <section className="bg-white p-2 sm:p-3 rounded-none border-[0.5px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]">
                <h2 className="text-sm sm:text-base md:text-lg font-black text-black mb-2">Frequently Asked Questions</h2>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <h3 className="font-semibold text-black mb-0.5 sm:mb-1 text-xs sm:text-sm">How long does it take to get a response?</h3>
                    <p className="text-gray-600 text-[10px] sm:text-xs">Most queries are answered within 24-48 hours. Payment and refund queries are prioritized and answered within 24 hours.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black mb-0.5 sm:mb-1 text-xs sm:text-sm">Can I call for support?</h3>
                    <p className="text-gray-600 text-[10px] sm:text-xs">Currently, we only provide email support. This helps us maintain detailed records and provide better assistance.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black mb-0.5 sm:mb-1 text-xs sm:text-sm">What if my issue is urgent?</h3>
                    <p className="text-gray-600 text-[10px] sm:text-xs">For payment failures or technical errors, email <a href="mailto:info@enqir.in" className="text-black hover:underline">info@enqir.in</a> with "URGENT" in the subject line.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-black mb-0.5 sm:mb-1 text-xs sm:text-sm">How do I track my refund status?</h3>
                    <p className="text-gray-600 text-[10px] sm:text-xs">After submitting a refund request, you'll receive a tracking number. Email <a href="mailto:info@enqir.in" className="text-black hover:underline">info@enqir.in</a> with your tracking number for updates.</p>
                  </div>
                </div>
              </section>

              <section className="bg-white p-2 sm:p-3 rounded-none border-[0.5px] border-black shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]">
                <h2 className="text-xs sm:text-sm md:text-base font-black text-black mb-2">📧 Email Template for Refund Requests</h2>
                <div className="bg-white p-2 sm:p-3 rounded-none border-[0.5px] border-black font-mono text-[10px] sm:text-xs text-gray-700 shadow-[0_2px_0_0_rgba(0,0,0,0.2)]">
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

              <section className="text-center text-gray-600 text-[10px] sm:text-xs border-t pt-2 sm:pt-3">
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

