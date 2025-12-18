// AddDummyEnquiries.tsx
// Admin page to add realistic Indian market dummy enquiries
// Add route: <Route path="/admin/add-enquiries" element={<AddDummyEnquiries />} />

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
// import Layout from '@/components/Layout';

const realisticEnquiries = [
  // English
  { category: 'home-furniture', categories: ['home-furniture'], title: 'Need good quality mattress urgently', description: 'Looking for orthopedic mattress for back pain. Budget around 15k. Need delivery in Bangalore. Any good brand suggestions welcome.', budget: 15000, location: 'Bangalore, Karnataka', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  { category: 'electronics-gadgets', categories: ['electronics-gadgets'], title: 'Want to buy smartphone under 20k', description: 'Looking for good phone with nice camera. For my daughter\'s birthday. Prefer Samsung or OnePlus. Need good battery backup.', budget: 20000, location: 'Delhi', deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) },
  { category: 'automobile', categories: ['automobile'], title: 'Need car service center', description: 'Want reliable service center for Maruti Swift. Need regular service and occasional repairs. Prefer authorized or trusted local mechanic.', budget: 5000, location: 'Gurgaon, Haryana', deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  
  // Hindi/Hinglish descriptions
  { category: 'food-beverage', categories: ['food-beverage'], title: 'Homemade pickle supplier needed for shop', description: 'Mere shop ke liye homemade mango pickle aur lemon pickle chahiye. Regular supply chahiye. Local supplier prefer karta hoon. Quality acchi honi chahiye. Monthly 5k tak ka order hoga.', budget: 5000, location: 'Delhi', deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  { category: 'construction-renovation', categories: ['construction-renovation'], title: 'Bathroom tap leaking - plumber needed urgently', description: 'Bathroom ka tap leak ho raha hai, bahut paani waste ho raha hai. Experienced plumber chahiye jo properly fix kar de. Kuch pipes bhi change karne hain. Urgent hai, kal tak chahiye.', budget: 3000, location: 'Hyderabad, Telangana', deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
  { category: 'education-training', categories: ['education-training'], title: 'Tuition teacher needed for Class 10 CBSE', description: 'CBSE Class 10 ke liye experienced teacher chahiye. Maths aur Science mein help chahiye. Home tuition prefer karta hoon. Good amount pay kar sakta hoon agar teacher accha hoga.', budget: 8000, location: 'Delhi', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  { category: 'service', categories: ['service'], title: 'CA needed for GST filing - small business', description: 'Small business ke liye chartered accountant chahiye. Monthly GST filing ke liye. Reliable aur affordable chahiye. Delhi mein chahiye. Long term basis pe kaam kar sakte hain.', budget: 3000, location: 'Delhi', deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
  { category: 'personal', categories: ['personal'], title: 'Cook needed for home - North Indian food', description: 'Ghar ke liye cook chahiye. North Indian food banana aana chahiye. Full time ya part time dono chalega. Delhi mein chahiye. Good salary de sakta hoon.', budget: 12000, location: 'Delhi', deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  
  // Malayalam descriptions
  { category: 'beauty-products', categories: ['beauty-products'], title: 'Pure Ayurvedic hair oil - amla bhringraj', description: 'Pure Ayurvedic hair oil venum. Amla, bhringraj or coconut based ok. Family ku bulk la venum. Organic prefer panren. Dabur, Patanjali or nalla trusted brand ok.', budget: 2000, location: 'Kerala', deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  { category: 'home-furniture', categories: ['home-furniture'], title: 'Second hand sofa set - 3+2 or L-shaped', description: 'Living room ku second hand sofa set venum. 3+2 or L-shaped rendum ok. Budget tight ah irukku so second hand prefer panren. Good condition venum. Mumbai la pickup panren.', budget: 20000, location: 'Mumbai, Maharashtra', deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) },
  { category: 'electronics-gadgets', categories: ['electronics-gadgets'], title: 'Laptop screen repair needed - HP laptop', description: 'HP laptop screen break ayyindhi. Warranty expire ayyindhi. Reliable repair shop venum. Genuine parts venum if possible. Screen replacement cheyinchali. Budget 8k varaku.', budget: 8000, location: 'Bangalore, Karnataka', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  
  // Tamil descriptions
  { category: 'construction-renovation', categories: ['construction-renovation'], title: '2BHK flat painting needed - interior and exterior', description: '2BHK flat paint pannanum. Interior and exterior rendum. Nalla quality paint venum - Asian Paints or Berger. Experienced workers venum. Budget flexible ah irukku if work nalla irundha.', budget: 50000, location: 'Chennai, Tamil Nadu', deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { category: 'fashion-apparel', categories: ['fashion-apparel'], title: 'Designer sarees for wedding - Kanjeevaram or Banarasi', description: 'Amma wedding ki designer sarees venum. Kanjeevaram or Banarasi sarees prefer chesthunna. Authentic and good quality venum. Per saree 40-50k budget. Varanasi or Chennai nunchi kuda ok.', budget: 45000, location: 'Varanasi, Uttar Pradesh', deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000) },
  { category: 'jewelry-accessories', categories: ['jewelry-accessories'], title: 'Gold jewelry - necklace and earrings set', description: 'Wedding function ki gold necklace and earrings set venum. 22k gold prefer chesthunna. Budget around 2 lakhs. Coimbatore lo venum. Authentic venum.', budget: 200000, location: 'Coimbatore, Tamil Nadu', deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  
  // Telugu descriptions
  { category: 'home-furniture', categories: ['home-furniture'], title: 'Modular kitchen installation needed', description: 'Kitchen renovate cheyali. Modular kitchen design and installation venum. Small kitchen undhi, around 2-3 lakhs budget. Godrej, Hettich or reliable brand ok. Experienced contractor venum.', budget: 250000, location: 'Pune, Maharashtra', deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
  { category: 'electronics-gadgets', categories: ['electronics-gadgets'], title: 'Smart TV 43 inch - Android TV preferred', description: 'Intlo ki smart TV venum 43 inch. Android TV prefer chesthunna. Picture quality baga undali. Mi, OnePlus or Samsung ok. Budget around 30k.', budget: 30000, location: 'Kolkata, West Bengal', deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
  { category: 'service', categories: ['service'], title: 'Electrician needed urgently - wiring problem', description: 'Intlo wiring lo problem undhi. Konni switches work avvatle. Experienced electrician venum proper ga fix cheyadaniki. Urgent, repati varaku venum. Hyderabad lo venum.', budget: 2000, location: 'Hyderabad, Telangana', deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
  { category: 'art', categories: ['art'], title: 'Wall painting needed - traditional Indian style', description: 'Living room ki custom wall painting venum. Traditional Indian style prefer chesthunna. Size around 6x4 feet venum. Hyderabad lo venum. Budget 30k.', budget: 30000, location: 'Hyderabad, Telangana', deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) },
  
  // Kannada descriptions
  { category: 'automobile', categories: ['automobile'], title: 'Second hand bike - Pulsar or Apache', description: 'Daily commute ge second hand bike beku. Pulsar 150 or Apache 160 prefer madtini. Good condition beku, low mileage. Budget 50-60k. Pune alli nodbahudu.', budget: 55000, location: 'Pune, Maharashtra', deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) },
  { category: 'education-training', categories: ['education-training'], title: 'Spoken English classes - job interview preparation', description: 'Job interview ge English speaking course beku. Online or offline rendu ok. Quick improvement beku. Budget around 5k. Bangalore alli beku. Weekend classes kuda ok.', budget: 5000, location: 'Bangalore, Karnataka', deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  { category: 'health-beauty', categories: ['health-beauty'], title: 'Yoga instructor needed for home - stress relief', description: 'Manege yoga teacher beku. Experienced beku. Stress relief and flexibility ge. Monthly basis pay madbahudu. Bangalore alli beku. Morning or evening classes ok.', budget: 6000, location: 'Bangalore, Karnataka', deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
  { category: 'business', categories: ['business'], title: 'Office furniture supplier - chairs and desks', description: 'Hosa office ge 20 chairs and 10 desks beku. Good quality ergonomic chairs prefer madtini. Budget around 2 lakhs. Bangalore alli beku. Bulk order ide.', budget: 200000, location: 'Bangalore, Karnataka', deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { category: 'childcare-family', categories: ['childcare-family'], title: 'Nanny needed for baby - 1 year old', description: '1 year baby ge reliable nanny beku. Experience and references rendu beku. Good salary kodbahudu if right person bandre. Bangalore alli beku.', budget: 15000, location: 'Bangalore, Karnataka', deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) },
  
  // Bengali descriptions
  { category: 'sports-outdoor', categories: ['sports-outdoor'], title: 'Cricket kit needed - bat pads gloves helmet', description: 'Complete cricket kit chai - bat, pads, gloves, helmet sob. Club cricket er jonno. Good quality chai but budget friendly. Kolkata te chai. Budget 8k.', budget: 8000, location: 'Kolkata, West Bengal', deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) },
  
  // Mixed language descriptions
  { category: 'sneakers', categories: ['sneakers'], title: 'Branded shoes - Nike or Adidas', description: 'Gym aur running ke liye branded shoes chahiye. Nike ya Adidas prefer karta hoon. Size 9 chahiye. Original chahiye, duplicate nahi. Budget 5-6k hai.', budget: 5500, location: 'Mumbai, Maharashtra', deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000) },
  { category: 'books-publications', categories: ['books-publications'], title: 'UPSC preparation books - NCERT and standard books', description: 'UPSC preparation ki books venum. NCERT books and standard reference books rendu venum. Second hand kuda ok if condition bagunte. Complete set venum. Budget 10k.', budget: 10000, location: 'Delhi', deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  { category: 'health-beauty', categories: ['health-beauty'], title: 'Gym membership - proper equipment and trainer', description: 'Apne area mein accha gym chahiye. Proper equipment aur trainer chahiye. Monthly 2-3k tak budget hai. Annual membership discount prefer karta hoon.', budget: 3000, location: 'Mumbai, Maharashtra', deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  { category: 'service', categories: ['service'], title: 'Photographer needed for birthday party', description: 'Bacche ki birthday party ke liye photographer chahiye. Candid shots aur group photos dono chahiye. Budget around 5k hai. Pune mein chahiye.', budget: 5000, location: 'Pune, Maharashtra', deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) },
  { category: 'business', categories: ['business'], title: 'Website developer needed - e-commerce website', description: 'Small business ki website cheyinchali. E-commerce functionality venum. Budget around 50k. Maintain kuda cheste baguntundi. Mumbai lo venum.', budget: 50000, location: 'Mumbai, Maharashtra', deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000) },
  { category: 'marketing-advertising', categories: ['marketing-advertising'], title: 'Social media manager needed - Instagram Facebook', description: 'Small business ki social media manager venum. Instagram and Facebook handle cheyali. Content creation and posting rendu venum. Monthly basis work undhi.', budget: 15000, location: 'Delhi', deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) },
  { category: 'jobs', categories: ['jobs'], title: 'Content writer needed - blog posts', description: 'Blog posts ki content writer venum. Tech and business topics lo ravali. Part-time or freelance rendu ok. Per article pay cheyochu. Good English required.', budget: 20000, location: 'Remote', deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) },
  { category: 'collectibles', categories: ['collectibles'], title: 'Old Indian coins - pre-independence coins', description: 'Old Indian coins and currency notes collect chesthunna. Pre-independence coins venum. Authentic items venum, fake kadu. Certificate kuda venum if possible.', budget: 10000, location: 'Delhi', deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { category: 'vintage', categories: ['vintage'], title: 'Vintage watches - HMT or Titan', description: 'Old HMT or Titan watches collect chesthunna. Vintage watches venum. Working condition prefer chesthunna. Budget model batti undhi. Mumbai lo venum.', budget: 5000, location: 'Mumbai, Maharashtra', deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) },
  { category: 'antiques', categories: ['antiques'], title: 'Brass antiques - lamps utensils decorative', description: 'Old brass items venum - lamps, utensils, decorative pieces. Authentic antiques venum, replicas kadu. Jaipur nunchi prefer chesthunna. Budget 15k varaku.', budget: 15000, location: 'Jaipur, Rajasthan', deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000) },
  { category: 'memorabilia', categories: ['memorabilia'], title: 'Cricket memorabilia - signed bats jerseys', description: 'Signed cricket bats or jerseys venum. Indian team players prefer chesthunna. Authentic items venum with certificate. Mumbai lo venum. Budget 20k varaku.', budget: 20000, location: 'Mumbai, Maharashtra', deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000) },
  { category: 'gaming-recreation', categories: ['gaming-recreation'], title: 'Gaming console - PlayStation or Xbox', description: 'PlayStation or Xbox venum. Second hand prefer chesthunna money save cheyadaniki. Working condition venum with some games. Bangalore lo venum. Budget 30k.', budget: 30000, location: 'Bangalore, Karnataka', deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) },
  { category: 'travel-tourism', categories: ['travel-tourism'], title: 'Goa trip package - family trip', description: 'Family trip plan chesthunna Goa ki. Package venum - hotel, transport, sightseeing anni. 3 days 2 nights trip. 4 members unnaru. Budget around 30k for all.', budget: 30000, location: 'Goa', deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { category: 'wedding-events', categories: ['wedding-events'], title: 'Wedding planner needed - complete planning', description: 'Amma wedding ki wedding planner venum. Complete planning venum - venue, catering, decoration, photography anni. Budget around 5 lakhs. Jaipur lo venum.', budget: 500000, location: 'Jaipur, Rajasthan', deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
  { category: 'events-entertainment', categories: ['events-entertainment'], title: 'DJ needed for birthday party - sound system', description: 'Birthday party ki DJ venum with sound system. Good music venum and proper setup. Budget around 8k. Delhi lo venum. Evening function undhi.', budget: 8000, location: 'Delhi', deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
  { category: 'real-estate', categories: ['real-estate'], title: '2BHK flat - good locality ready to move', description: '2BHK apartment konedam undhi. Good locality venum. Ready to move prefer chesthunna. Good connectivity venum. Budget 50-60 lakhs. Bangalore lo venum.', budget: 5500000, location: 'Bangalore, Karnataka', deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
  { category: 'real-estate-services', categories: ['real-estate-services'], title: 'Property documents help - registration', description: 'Property registration and documentation lo help venum. Lawyer or agent venum proper ga guide cheyadaniki. Mumbai lo venum. Budget 15k.', budget: 15000, location: 'Mumbai, Maharashtra', deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) },
  { category: 'pets', categories: ['pets'], title: 'Pet grooming service - Golden Retriever', description: 'Golden Retriever ki pet grooming venum. Regular service venum. Home service prefer chesthunna. Per visit around 1.5k budget. Mumbai lo venum.', budget: 1500, location: 'Mumbai, Maharashtra', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  { category: 'technology', categories: ['technology'], title: 'App developer needed - Android iOS', description: 'Business ki mobile app cheyinchali. Android and iOS rendu platforms lo venum. Experienced developer venum. Budget around 1 lakh. Bangalore lo venum.', budget: 100000, location: 'Bangalore, Karnataka', deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
  { category: 'agriculture-farming', categories: ['agriculture-farming'], title: 'Organic fertilizer - vegetable farming', description: 'Vegetable farming ki organic fertilizer venum. 5 acre land undhi. Good quality certified organic products venum. Punjab lo venum. Budget 50k.', budget: 50000, location: 'Punjab', deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) },
  { category: 'security-safety', categories: ['security-safety'], title: 'CCTV installation - home security', description: 'Home security ki CCTV cameras venum. 4 cameras venum with DVR. Good quality night vision cameras venum. Noida lo venum. Budget 25k.', budget: 25000, location: 'Noida, Uttar Pradesh', deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
  { category: 'transportation-logistics', categories: ['transportation-logistics'], title: 'Goods transport - Mumbai to Bangalore', description: 'Furniture transport cheyali Mumbai nunchi Bangalore ki. Reliable transport service venum. Packing and moving rendu venum. Budget 20k. Urgent kadu.', budget: 20000, location: 'Mumbai, Maharashtra', deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
];

export default function AddDummyEnquiries() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const enquiriesCount = realisticEnquiries?.length || 46;
  const [progress, setProgress] = useState({ current: 0, total: enquiriesCount });
  const [error, setError] = useState<string | null>(null);

  // Check admin access - require secure link access
  useEffect(() => {
    const checkAccess = () => {
      const secureLinkAccess = typeof window !== 'undefined' ? sessionStorage.getItem('admin_secure_link_accessed') : null;
      
      if (!secureLinkAccess) {
        setIsAuthorized(false);
        setCheckingAccess(false);
        return;
      }

      // Check if session has expired (24 hours)
      const secureLinkTimestamp = sessionStorage.getItem('admin_secure_link_timestamp');
      if (secureLinkTimestamp) {
        const timestamp = parseInt(secureLinkTimestamp, 10);
        const now = Date.now();
        const hoursSinceAccess = (now - timestamp) / (1000 * 60 * 60);
        
        if (hoursSinceAccess > 24) {
          sessionStorage.removeItem('admin_secure_link_accessed');
          sessionStorage.removeItem('admin_secure_link_timestamp');
          setIsAuthorized(false);
          setCheckingAccess(false);
          return;
        }
      }

      setIsAuthorized(true);
      setCheckingAccess(false);
    };

    checkAccess();
  }, []);

  const handleAddEnquiries = async () => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'Please log in first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);
    const totalCount = realisticEnquiries?.length || 46;
    setProgress({ current: 0, total: totalCount });

    let successCount = 0;
    let errorCount = 0;

    try {
      const enquiriesList = realisticEnquiries || [];
      for (let i = 0; i < enquiriesList.length; i++) {
        const enquiry = enquiriesList[i];
        try {
          // Calculate isUrgent based on deadline
          const isUrgent = enquiry.deadline ? (() => {
            const now = new Date();
            const diffHours = (enquiry.deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
            return diffHours < 72;
          })() : false;

          // Ensure categories array exists and is valid
          const categories = enquiry.categories && Array.isArray(enquiry.categories) && enquiry.categories.length > 0 
            ? enquiry.categories 
            : [enquiry.category || 'other'];
          
          const primaryCategory = categories[0] || 'other';

          // Match PostEnquiry structure exactly
          const enquiryData: any = {
            title: String(enquiry.title || '').trim(),
            description: String(enquiry.description || '').trim(),
            category: primaryCategory,
            categories: categories,
            budget: enquiry.budget ? Number(enquiry.budget) : null,
            location: String(enquiry.location || '').trim(),
            deadline: enquiry.deadline || null,
            isUrgent: isUrgent,
            status: 'live',
            isPremium: false,
            selectedPlanId: 'free',
            selectedPlanPrice: 0,
            paymentStatus: 'completed',
            createdAt: serverTimestamp(),
            userId: user.uid,
            userEmail: user.email || null,
            userName: user.displayName || user.email?.split('@')[0] || 'Admin User',
            responses: 0,
            likes: 0,
            shares: 0,
            views: 0,
            userLikes: [],
            notes: '',
            userVerified: false,
            isProfileVerified: false,
            profileVerificationStatus: 'pending',
            governmentIdFront: null,
            governmentIdBack: null,
            idFrontImage: null,
            idBackImage: null,
            isDummyEnquiry: true, // Flag to identify dummy enquiries
          };

          await addDoc(collection(db, 'enquiries'), enquiryData);
          successCount++;
          setProgress({ current: i + 1, total: enquiriesList.length });
          
          // Small delay to avoid overwhelming Firestore
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error: any) {
          console.error(`Error adding "${enquiry.title}":`, error);
          errorCount++;
        }
      }

      toast({
        title: 'Success!',
        description: `Added ${successCount} enquiries. ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
      });
    } catch (error: any) {
      console.error('Error:', error);
      setError(error?.message || 'Failed to add enquiries');
      toast({
        title: 'Error',
        description: error?.message || 'Failed to add enquiries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      const totalCount = realisticEnquiries?.length || 46;
      setProgress({ current: 0, total: totalCount });
    }
  };

  const handleRemoveDummyEnquiries = async () => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'Please log in first',
        variant: 'destructive',
      });
      return;
    }

    if (!window.confirm('Are you sure you want to remove all dummy enquiries? This will only delete enquiries marked as dummy enquiries added by you.')) {
      return;
    }

    setRemoving(true);
    setError(null);

    try {
      // Query for all dummy enquiries created by this admin user
      const dummyEnquiriesQuery = query(
        collection(db, 'enquiries'),
        where('isDummyEnquiry', '==', true),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(dummyEnquiriesQuery);
      const dummyEnquiries = snapshot.docs;
      
      if (dummyEnquiries.length === 0) {
        toast({
          title: 'No Dummy Enquiries Found',
          description: 'No dummy enquiries found to remove.',
        });
        setRemoving(false);
        return;
      }

      setProgress({ current: 0, total: dummyEnquiries.length });

      let deletedCount = 0;
      let errorCount = 0;

      // Delete enquiries in batches to avoid overwhelming Firestore
      for (let i = 0; i < dummyEnquiries.length; i++) {
        try {
          await deleteDoc(doc(db, 'enquiries', dummyEnquiries[i].id));
          deletedCount++;
          setProgress({ current: i + 1, total: dummyEnquiries.length });
          
          // Small delay to avoid overwhelming Firestore
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          console.error(`Error deleting dummy enquiry ${dummyEnquiries[i].id}:`, error);
          errorCount++;
        }
      }

      toast({
        title: 'Success!',
        description: `Removed ${deletedCount} dummy enquiries. ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
      });
    } catch (error: any) {
      console.error('Error removing dummy enquiries:', error);
      setError(error?.message || 'Failed to remove dummy enquiries');
      toast({
        title: 'Error',
        description: error?.message || 'Failed to remove dummy enquiries',
        variant: 'destructive',
      });
    } finally {
      setRemoving(false);
      setProgress({ current: 0, total: enquiriesCount });
    }
  };

  // Show loading while checking access
  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Checking admin access...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Show access denied if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="p-6 max-w-md">
          <div className="text-center">
            <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-gray-900">Admin Access Required</h1>
            <p className="text-gray-600 mb-4">You must access this page through the secret private link.</p>
            <p className="text-sm text-gray-500 mb-4">Direct access is not allowed for security reasons.</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show error if component fails to render
  if (error && !loading && !removing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="p-6 max-w-md">
          <h1 className="text-xl font-bold mb-2 text-red-600">Error</h1>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6 bg-white">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Add Dummy Enquiries</h1>
          <p className="text-gray-600 mb-6">
            This will add {enquiriesCount} realistic Indian market enquiries covering various categories.
          </p>

          {(loading || removing) && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress: {progress.current} / {progress.total}</span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${removing ? 'bg-red-600' : 'bg-blue-600'}`}
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleAddEnquiries}
              disabled={loading || removing || !user}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Adding Enquiries...' : `Add ${enquiriesCount} Enquiries`}
            </Button>

            <Button
              onClick={handleRemoveDummyEnquiries}
              disabled={loading || removing || !user}
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {removing ? 'Removing Enquiries...' : 'Remove Dummy Enquiries'}
            </Button>
          </div>

          {!user && (
            <p className="text-sm text-red-600 mt-2">Please log in to add or remove enquiries</p>
          )}
        </Card>
      </div>
    </div>
  );
}

