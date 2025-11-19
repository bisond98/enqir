import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ShippingPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <Card className="shadow-xl border-2 border-gray-200 rounded-2xl sm:rounded-3xl overflow-hidden">
          <CardHeader className="bg-black text-white p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold">
              Shipping & Delivery Policy
            </CardTitle>
            <p className="text-gray-200 text-xs sm:text-sm mt-2">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="bg-white p-4 sm:p-6 lg:p-8">
            <div className="space-y-4 sm:space-y-6 text-gray-700 text-sm sm:text-base leading-relaxed">
              
              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">1. Overview</h2>
                <p className="mb-2 sm:mb-3">
                  Enqir.in is a digital marketplace platform that connects buyers and sellers. Our services are primarily digital and delivered instantly through our online platform. This Shipping & Delivery Policy outlines our delivery methods, timelines, and policies.
                </p>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">2. Digital Services Delivery</h2>
                <p className="mb-2 sm:mb-3">
                  Since Enqir.in operates as a digital marketplace platform:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                  <li><strong>Instant Access:</strong> Upon successful payment, users gain immediate access to premium features, enquiry posting capabilities, and platform services.</li>
                  <li><strong>No Physical Shipping:</strong> We do not ship physical products. All services are delivered digitally through our web platform.</li>
                  <li><strong>Account Activation:</strong> Premium plan activations and feature upgrades are processed instantly and reflected in your account immediately.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">3. Service Delivery Timeline</h2>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 mb-2 sm:mb-3">
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2">
                    <li><strong>Premium Plan Activation:</strong> Immediate (within seconds of payment confirmation)</li>
                    <li><strong>Enquiry Posting:</strong> Instant (enquiries appear on the platform immediately after submission)</li>
                    <li><strong>Feature Access:</strong> Instant (all paid features are available immediately upon activation)</li>
                    <li><strong>Response Notifications:</strong> Real-time (sellers can respond to enquiries instantly)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">4. Third-Party Seller Transactions</h2>
                <p className="mb-2 sm:mb-3">
                  For transactions between buyers and sellers facilitated through our platform:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                  <li><strong>Seller Responsibility:</strong> Individual sellers are responsible for their own shipping and delivery arrangements for physical products (if any).</li>
                  <li><strong>Platform Role:</strong> Enqir.in acts as a facilitator and is not responsible for shipping, delivery, or fulfillment of physical products sold by third-party sellers.</li>
                  <li><strong>Buyer-Seller Agreement:</strong> Shipping terms, delivery timelines, and costs are to be agreed upon directly between the buyer and seller.</li>
                  <li><strong>Dispute Resolution:</strong> Any shipping or delivery disputes between buyers and sellers should be resolved directly between the parties. Enqir.in may assist in dispute resolution but is not liable for shipping issues.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">5. Delivery Confirmation</h2>
                <p className="mb-2 sm:mb-3">
                  For digital services:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                  <li>You will receive an email confirmation immediately upon successful payment and service activation.</li>
                  <li>Your account dashboard will reflect the activated services and features instantly.</li>
                  <li>For enquiry postings, you will receive a confirmation email with your enquiry ID and details.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">6. Delivery Issues</h2>
                <p className="mb-2 sm:mb-3">
                  If you experience any issues accessing your purchased services:
                </p>
                <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                  <li>Check your email (including spam folder) for confirmation messages</li>
                  <li>Log out and log back into your account</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Contact our support team at <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline font-semibold">info@enqir.in</a> with your transaction ID</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">7. Contact Information</h2>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                  <p className="mb-1 sm:mb-2"><strong>Business Name:</strong> Enqir (Individual/Sole Proprietorship)</p>
                  <p className="mb-1 sm:mb-2"><strong>Owner Name:</strong> Nived Sunil S</p>
                  <p className="mb-1 sm:mb-2"><strong>Email:</strong> <a href="mailto:info@enqir.in" className="text-blue-600 hover:underline">info@enqir.in</a></p>
                  <p className="mb-1 sm:mb-2"><strong>Phone:</strong> +91 9747460245</p>
                  <p className="mb-1 sm:mb-2"><strong>Address:</strong> Kunnath house, Thenkara Po Mannarkkad, Palakkad, Kerala</p>
                  <p className="mb-1 sm:mb-2"><strong>Website:</strong> <a href="https://enqir.in" className="text-blue-600 hover:underline">https://enqir.in</a></p>
                </div>
              </section>

            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ShippingPolicy;

