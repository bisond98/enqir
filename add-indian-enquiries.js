// add-indian-enquiries.js
// Run this script in your browser console while logged into the app
// Or use Firebase Admin SDK for Node.js (see alternative script below)

// Realistic Indian market enquiries - covering needs, necessities, hobbies, and business

const realisticEnquiries = [
  // === DAILY NECESSITIES ===
  {
    category: 'home-furniture',
    categories: ['home-furniture'],
    title: 'Need good quality mattress urgently',
    description: 'Looking for orthopedic mattress for back pain. Budget around 15k. Need delivery in Bangalore. Any good brand suggestions welcome.',
    budget: 15000,
    location: 'Bangalore, Karnataka',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'food-beverage',
    categories: ['food-beverage'],
    title: 'Want homemade pickle supplier',
    description: 'Looking for someone who makes authentic homemade mango pickle, lemon pickle. Need regular supply for small shop. Prefer local supplier.',
    budget: 5000,
    location: 'Delhi',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'beauty-products',
    categories: ['beauty-products'],
    title: 'Need Ayurvedic hair oil',
    description: 'Looking for pure Ayurvedic hair oil - amla, bhringraj, or coconut based. Want to buy in bulk for family use. Prefer organic.',
    budget: 2000,
    location: 'Kerala',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  },

  // === HOME & HOUSEHOLD ===
  {
    category: 'home-furniture',
    categories: ['home-furniture'],
    title: 'Want to buy second hand sofa set',
    description: 'Looking for good condition sofa set for living room. 3+2 or L-shaped. Budget tight so prefer second hand. Can pick up.',
    budget: 20000,
    location: 'Mumbai, Maharashtra',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'home-furniture',
    categories: ['home-furniture'],
    title: 'Need modular kitchen installation',
    description: 'Want to renovate kitchen. Need someone who can design and install modular kitchen. Small kitchen, budget around 2-3 lakhs.',
    budget: 250000,
    location: 'Pune, Maharashtra',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'construction-renovation',
    categories: ['construction-renovation'],
    title: 'Need plumber for bathroom repair',
    description: 'Bathroom tap leaking badly. Need experienced plumber who can fix it properly. Also need to change some pipes. Urgent.',
    budget: 3000,
    location: 'Hyderabad, Telangana',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'construction-renovation',
    categories: ['construction-renovation'],
    title: 'Want house painting contractor',
    description: 'Need to paint entire 2BHK flat. Interior and exterior. Need good quality paint and experienced workers. Budget flexible for good work.',
    budget: 50000,
    location: 'Chennai, Tamil Nadu',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },

  // === ELECTRONICS & GADGETS ===
  {
    category: 'electronics-gadgets',
    categories: ['electronics-gadgets'],
    title: 'Want to buy smartphone under 20k',
    description: 'Looking for good phone with nice camera. For my daughter\'s birthday. Prefer Samsung or OnePlus. Need good battery backup.',
    budget: 20000,
    location: 'Delhi',
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'electronics-gadgets',
    categories: ['electronics-gadgets'],
    title: 'Need laptop repair service',
    description: 'Laptop screen broken. Need reliable repair shop. HP laptop, out of warranty. Want genuine parts if possible.',
    budget: 8000,
    location: 'Bangalore, Karnataka',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'electronics-gadgets',
    categories: ['electronics-gadgets'],
    title: 'Want smart TV 43 inch',
    description: 'Looking for smart TV for home. Prefer Android TV. Good picture quality important. Budget around 30k.',
    budget: 30000,
    location: 'Kolkata, West Bengal',
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  },

  // === AUTOMOBILE ===
  {
    category: 'automobile',
    categories: ['automobile'],
    title: 'Want second hand bike',
    description: 'Looking for used bike - Pulsar or Apache. Good condition, low mileage. Budget 50-60k. Need for daily commute.',
    budget: 55000,
    location: 'Pune, Maharashtra',
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'automobile',
    categories: ['automobile'],
    title: 'Need car service center',
    description: 'Want reliable service center for Maruti Swift. Need regular service and occasional repairs. Prefer authorized or trusted local mechanic.',
    budget: 5000,
    location: 'Gurgaon, Haryana',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  },

  // === FASHION & CLOTHING ===
  {
    category: 'fashion-apparel',
    categories: ['fashion-apparel'],
    title: 'Need designer sarees for wedding',
    description: 'Looking for Kanjeevaram or Banarasi sarees for daughter\'s wedding. Want authentic, good quality. Budget around 40-50k per saree.',
    budget: 45000,
    location: 'Varanasi, Uttar Pradesh',
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'fashion-apparel',
    categories: ['fashion-apparel'],
    title: 'Want branded shoes',
    description: 'Looking for Nike or Adidas sports shoes. Size 9. For gym and running. Prefer original, not fake. Budget around 5-6k.',
    budget: 5500,
    location: 'Mumbai, Maharashtra',
    deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
  },

  // === EDUCATION & LEARNING ===
  {
    category: 'education-training',
    categories: ['education-training'],
    title: 'Need tuition teacher for Class 10',
    description: 'Looking for experienced teacher for CBSE Class 10. Need help with Maths and Science. Home tuition preferred. Can pay good amount.',
    budget: 8000,
    location: 'Delhi',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'education-training',
    categories: ['education-training'],
    title: 'Want spoken English classes',
    description: 'Need English speaking course for job interview. Online or offline both fine. Need quick improvement. Budget around 5k.',
    budget: 5000,
    location: 'Bangalore, Karnataka',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'books-publications',
    categories: ['books-publications'],
    title: 'Want UPSC preparation books',
    description: 'Looking for second hand UPSC books - NCERT, standard books. Need complete set. Budget around 10k for all books.',
    budget: 10000,
    location: 'Delhi',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  },

  // === HEALTH & WELLNESS ===
  {
    category: 'health-beauty',
    categories: ['health-beauty'],
    title: 'Need yoga instructor',
    description: 'Looking for yoga teacher for home. Need someone experienced. For stress relief and flexibility. Can pay monthly.',
    budget: 6000,
    location: 'Bangalore, Karnataka',
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'health-beauty',
    categories: ['health-beauty'],
    title: 'Want gym membership',
    description: 'Looking for good gym near my area. Need proper equipment and trainer. Budget around 2-3k per month. Prefer annual membership discount.',
    budget: 3000,
    location: 'Mumbai, Maharashtra',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  },

  // === SERVICES ===
  {
    category: 'service',
    categories: ['service'],
    title: 'Need CA for GST filing',
    description: 'Looking for chartered accountant for monthly GST filing. Small business. Need someone reliable and affordable.',
    budget: 3000,
    location: 'Delhi',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'service',
    categories: ['service'],
    title: 'Want photographer for birthday party',
    description: 'Need photographer for child\'s birthday party. Want candid shots and some group photos. Budget around 5k.',
    budget: 5000,
    location: 'Pune, Maharashtra',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'service',
    categories: ['service'],
    title: 'Need electrician urgently',
    description: 'House wiring problem. Need experienced electrician who can fix it properly. Some switches not working. Urgent.',
    budget: 2000,
    location: 'Hyderabad, Telangana',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },

  // === BUSINESS NEEDS ===
  {
    category: 'business',
    categories: ['business'],
    title: 'Want office furniture supplier',
    description: 'Need 20 office chairs and 10 desks for new office. Want good quality, ergonomic chairs. Budget around 2 lakhs.',
    budget: 200000,
    location: 'Bangalore, Karnataka',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'business',
    categories: ['business'],
    title: 'Need website developer',
    description: 'Want to create website for small business. Need e-commerce functionality. Budget around 50k. Need someone who can maintain also.',
    budget: 50000,
    location: 'Mumbai, Maharashtra',
    deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'marketing-advertising',
    categories: ['marketing-advertising'],
    title: 'Need social media manager',
    description: 'Looking for someone to handle Instagram and Facebook for small business. Need content creation and posting. Monthly basis.',
    budget: 15000,
    location: 'Delhi',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'jobs',
    categories: ['jobs'],
    title: 'Hiring content writer',
    description: 'Need content writer for blog posts. Tech and business topics. Part-time or freelance. Can pay per article. Good English required.',
    budget: 20000,
    location: 'Remote',
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  },

  // === HOBBIES & COLLECTIBLES ===
  {
    category: 'collectibles',
    categories: ['collectibles'],
    title: 'Want old Indian coins',
    description: 'Collecting old Indian coins and currency notes. Looking for pre-independence coins. Want authentic items, not fake.',
    budget: 10000,
    location: 'Delhi',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'vintage',
    categories: ['vintage'],
    title: 'Looking for vintage watches',
    description: 'Want old HMT or Titan watches. Collecting vintage watches. Prefer working condition. Budget depends on model.',
    budget: 5000,
    location: 'Mumbai, Maharashtra',
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'antiques',
    categories: ['antiques'],
    title: 'Want brass antiques',
    description: 'Looking for old brass items - lamps, utensils, decorative pieces. Prefer authentic antiques, not replicas.',
    budget: 15000,
    location: 'Jaipur, Rajasthan',
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'memorabilia',
    categories: ['memorabilia'],
    title: 'Want cricket memorabilia',
    description: 'Looking for signed cricket bats or jerseys. Indian team players preferred. Want authentic items with certificate.',
    budget: 20000,
    location: 'Mumbai, Maharashtra',
    deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
  },

  // === SPORTS & RECREATION ===
  {
    category: 'sports-outdoor',
    categories: ['sports-outdoor'],
    title: 'Want cricket kit',
    description: 'Need complete cricket kit - bat, pads, gloves, helmet. For club cricket. Good quality but budget friendly.',
    budget: 8000,
    location: 'Kolkata, West Bengal',
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'gaming-recreation',
    categories: ['gaming-recreation'],
    title: 'Want gaming console',
    description: 'Looking for PlayStation or Xbox. Prefer second hand to save money. Want working condition with some games.',
    budget: 30000,
    location: 'Bangalore, Karnataka',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },

  // === TRAVEL & TOURISM ===
  {
    category: 'travel-tourism',
    categories: ['travel-tourism'],
    title: 'Want travel package for Goa',
    description: 'Planning family trip to Goa. Need package with hotel, transport, sightseeing. 3 days 2 nights. Budget around 30k for 4 people.',
    budget: 30000,
    location: 'Goa',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },

  // === WEDDING & EVENTS ===
  {
    category: 'wedding-events',
    categories: ['wedding-events'],
    title: 'Need wedding planner',
    description: 'Looking for wedding planner for daughter\'s wedding. Need complete planning - venue, catering, decoration, photography. Budget around 5 lakhs.',
    budget: 500000,
    location: 'Jaipur, Rajasthan',
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'events-entertainment',
    categories: ['events-entertainment'],
    title: 'Want DJ for party',
    description: 'Need DJ with sound system for birthday party. Want good music and proper setup. Budget around 8k.',
    budget: 8000,
    location: 'Delhi',
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  },

  // === REAL ESTATE ===
  {
    category: 'real-estate',
    categories: ['real-estate'],
    title: 'Looking to buy 2BHK flat',
    description: 'Want to buy 2BHK apartment in good locality. Budget 50-60 lakhs. Prefer ready to move. Need good connectivity.',
    budget: 5500000,
    location: 'Bangalore, Karnataka',
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'real-estate-services',
    categories: ['real-estate-services'],
    title: 'Need property documents help',
    description: 'Want help with property registration and documentation. Need lawyer or agent who can guide properly.',
    budget: 15000,
    location: 'Mumbai, Maharashtra',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },

  // === PERSONAL NEEDS ===
  {
    category: 'personal',
    categories: ['personal'],
    title: 'Need cook for home',
    description: 'Looking for cook for home. Need someone who can make North Indian food. Full time or part time both fine.',
    budget: 12000,
    location: 'Delhi',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'childcare-family',
    categories: ['childcare-family'],
    title: 'Want nanny for baby',
    description: 'Need reliable nanny for 1 year old baby. Must have experience and references. Can pay good salary for right person.',
    budget: 15000,
    location: 'Bangalore, Karnataka',
    deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
  },
  {
    category: 'pets',
    categories: ['pets'],
    title: 'Need pet grooming service',
    description: 'Want pet grooming for Golden Retriever. Need regular service. Home service preferred. Budget around 1.5k per visit.',
    budget: 1500,
    location: 'Mumbai, Maharashtra',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },

  // === TECHNOLOGY ===
  {
    category: 'technology',
    categories: ['technology'],
    title: 'Need app developer',
    description: 'Want to create mobile app for business. Need Android and iOS developer. Budget around 1 lakh. Need someone experienced.',
    budget: 100000,
    location: 'Bangalore, Karnataka',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  },

  // === AGRICULTURE ===
  {
    category: 'agriculture-farming',
    categories: ['agriculture-farming'],
    title: 'Want organic fertilizer',
    description: 'Need organic fertilizer for vegetable farming. 5 acre land. Want good quality, certified organic products.',
    budget: 50000,
    location: 'Punjab',
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },

  // === SECURITY ===
  {
    category: 'security-safety',
    categories: ['security-safety'],
    title: 'Need CCTV installation',
    description: 'Want CCTV cameras for home security. Need 4 cameras with DVR. Want good quality night vision cameras.',
    budget: 25000,
    location: 'Noida, Uttar Pradesh',
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  },

  // === JEWELRY ===
  {
    category: 'jewelry-accessories',
    categories: ['jewelry-accessories'],
    title: 'Want gold jewelry',
    description: 'Looking for gold necklace and earrings set. For wedding function. 22k gold preferred. Budget around 2 lakhs.',
    budget: 200000,
    location: 'Coimbatore, Tamil Nadu',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },

  // === ART ===
  {
    category: 'art',
    categories: ['art'],
    title: 'Need wall painting for home',
    description: 'Want custom wall painting for living room. Traditional Indian style preferred. Size around 6x4 feet.',
    budget: 30000,
    location: 'Hyderabad, Telangana',
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  },

  // === TRANSPORTATION ===
  {
    category: 'transportation-logistics',
    categories: ['transportation-logistics'],
    title: 'Need goods transport',
    description: 'Want to transport furniture from Mumbai to Bangalore. Need reliable transport service. Packing and moving required.',
    budget: 20000,
    location: 'Mumbai, Maharashtra',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  },
];

// Function to add enquiries (for browser console)
async function addEnquiriesToFirestore() {
  // This function should be run in browser console after importing Firebase
  // Make sure you're logged in and have access to db from firebase.ts
  
  console.log('🚀 Starting to add realistic Indian enquiries...');
  
  // Import Firebase (adjust path as needed)
  const { db } = await import('./src/firebase.ts');
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  
  // Get current user ID (you need to be logged in)
  const { auth } = await import('./src/firebase.ts');
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    console.error('❌ Please log in first!');
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const enquiry of realisticEnquiries) {
    try {
      const enquiryData = {
        ...enquiry,
        userId: userId,
        status: 'live',
        responses: 0,
        likes: 0,
        shares: 0,
        views: 0,
        userLikes: [],
        notes: '',
        userVerified: true,
        isProfileVerified: true,
        isUrgent: enquiry.deadline ? (() => {
          const now = new Date();
          const diffHours = (enquiry.deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
          return diffHours < 72;
        })() : false,
        createdAt: serverTimestamp(),
        paymentStatus: 'completed',
        isPremium: false,
        selectedPlanId: 'free',
        selectedPlanPrice: 0,
      };
      
      await addDoc(collection(db, 'enquiries'), enquiryData);
      console.log(`✅ Added: ${enquiry.title}`);
      successCount++;
      
      // Small delay to avoid overwhelming Firestore
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Error adding ${enquiry.title}:`, error);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`\n🎉 Done!`);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { realisticEnquiries, addEnquiriesToFirestore };
}

