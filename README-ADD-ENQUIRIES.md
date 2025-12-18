# How to Add Dummy Enquiries

## Option 1: Browser Console (Easiest)

1. **Open your Enqir app** (localhost or live site)
2. **Log in** to your account
3. **Open browser console** (F12 or Right-click > Inspect > Console)
4. **Copy the script below** and paste into console
5. **Press Enter** to run

### Script for Browser Console:

```javascript
// Copy everything below this line
(async function addEnquiries() {
  // Import Firebase functions
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  
  // Get db from your app - adjust path if needed
  // If your app exposes db globally, use: const db = window.db;
  // Otherwise, you may need to import from your firebase config
  
  const enquiries = [
    { category: 'home-furniture', categories: ['home-furniture'], title: 'Need good quality mattress urgently', description: 'Looking for orthopedic mattress for back pain. Budget around 15k. Need delivery in Bangalore. Any good brand suggestions welcome.', budget: 15000, location: 'Bangalore, Karnataka', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { category: 'food-beverage', categories: ['food-beverage'], title: 'Want homemade pickle supplier', description: 'Looking for someone who makes authentic homemade mango pickle, lemon pickle. Need regular supply for small shop. Prefer local supplier.', budget: 5000, location: 'Delhi', deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    { category: 'beauty-products', categories: ['beauty-products'], title: 'Need Ayurvedic hair oil', description: 'Looking for pure Ayurvedic hair oil - amla, bhringraj, or coconut based. Want to buy in bulk for family use. Prefer organic.', budget: 2000, location: 'Kerala', deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
    { category: 'home-furniture', categories: ['home-furniture'], title: 'Want to buy second hand sofa set', description: 'Looking for good condition sofa set for living room. 3+2 or L-shaped. Budget tight so prefer second hand. Can pick up.', budget: 20000, location: 'Mumbai, Maharashtra', deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) },
    { category: 'construction-renovation', categories: ['construction-renovation'], title: 'Need plumber for bathroom repair', description: 'Bathroom tap leaking badly. Need experienced plumber who can fix it properly. Also need to change some pipes. Urgent.', budget: 3000, location: 'Hyderabad, Telangana', deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    { category: 'electronics-gadgets', categories: ['electronics-gadgets'], title: 'Want to buy smartphone under 20k', description: 'Looking for good phone with nice camera. For my daughter\'s birthday. Prefer Samsung or OnePlus. Need good battery backup.', budget: 20000, location: 'Delhi', deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) },
    { category: 'automobile', categories: ['automobile'], title: 'Want second hand bike', description: 'Looking for used bike - Pulsar or Apache. Good condition, low mileage. Budget 50-60k. Need for daily commute.', budget: 55000, location: 'Pune, Maharashtra', deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) },
    { category: 'fashion-apparel', categories: ['fashion-apparel'], title: 'Need designer sarees for wedding', description: 'Looking for Kanjeevaram or Banarasi sarees for daughter\'s wedding. Want authentic, good quality. Budget around 40-50k per saree.', budget: 45000, location: 'Varanasi, Uttar Pradesh', deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000) },
    { category: 'education-training', categories: ['education-training'], title: 'Need tuition teacher for Class 10', description: 'Looking for experienced teacher for CBSE Class 10. Need help with Maths and Science. Home tuition preferred. Can pay good amount.', budget: 8000, location: 'Delhi', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { category: 'service', categories: ['service'], title: 'Need CA for GST filing', description: 'Looking for chartered accountant for monthly GST filing. Small business. Need someone reliable and affordable.', budget: 3000, location: 'Delhi', deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
    { category: 'business', categories: ['business'], title: 'Want office furniture supplier', description: 'Need 20 office chairs and 10 desks for new office. Want good quality, ergonomic chairs. Budget around 2 lakhs.', budget: 200000, location: 'Bangalore, Karnataka', deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    { category: 'collectibles', categories: ['collectibles'], title: 'Want old Indian coins', description: 'Collecting old Indian coins and currency notes. Looking for pre-independence coins. Want authentic items, not fake.', budget: 10000, location: 'Delhi', deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    { category: 'sports-outdoor', categories: ['sports-outdoor'], title: 'Want cricket kit', description: 'Need complete cricket kit - bat, pads, gloves, helmet. For club cricket. Good quality but budget friendly.', budget: 8000, location: 'Kolkata, West Bengal', deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) },
    { category: 'travel-tourism', categories: ['travel-tourism'], title: 'Want travel package for Goa', description: 'Planning family trip to Goa. Need package with hotel, transport, sightseeing. 3 days 2 nights. Budget around 30k for 4 people.', budget: 30000, location: 'Goa', deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    { category: 'wedding-events', categories: ['wedding-events'], title: 'Need wedding planner', description: 'Looking for wedding planner for daughter\'s wedding. Need complete planning - venue, catering, decoration, photography. Budget around 5 lakhs.', budget: 500000, location: 'Jaipur, Rajasthan', deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
    { category: 'real-estate', categories: ['real-estate'], title: 'Looking to buy 2BHK flat', description: 'Want to buy 2BHK apartment in good locality. Budget 50-60 lakhs. Prefer ready to move. Need good connectivity.', budget: 5500000, location: 'Bangalore, Karnataka', deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    { category: 'personal', categories: ['personal'], title: 'Need cook for home', description: 'Looking for cook for home. Need someone who can make North Indian food. Full time or part time both fine.', budget: 12000, location: 'Delhi', deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
    { category: 'technology', categories: ['technology'], title: 'Need app developer', description: 'Want to create mobile app for business. Need Android and iOS developer. Budget around 1 lakh. Need someone experienced.', budget: 100000, location: 'Bangalore, Karnataka', deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
  ];
  
  // Access Firebase - you'll need to adjust this based on your app structure
  // Try one of these:
  // const db = window.__FIREBASE_DB__; // if exposed globally
  // OR import from your firebase config file
  
  console.log('📝 Ready to add', enquiries.length, 'enquiries');
  console.log('⚠️ You need to set up db access. Check your Firebase config.');
  
  // Once db is accessible, uncomment below:
  /*
  const userId = 'YOUR_USER_ID'; // Get from auth.currentUser.uid
  
  for (let i = 0; i < enquiries.length; i++) {
    const e = enquiries[i];
    const data = {
      ...e,
      userId,
      status: 'live',
      responses: 0,
      likes: 0,
      shares: 0,
      views: 0,
      userLikes: [],
      notes: '',
      userVerified: true,
      isProfileVerified: true,
      isUrgent: e.deadline ? ((e.deadline.getTime() - Date.now()) / (1000 * 60 * 60)) < 72 : false,
      createdAt: serverTimestamp(),
      paymentStatus: 'completed',
      isPremium: false,
      selectedPlanId: 'free',
      selectedPlanPrice: 0,
    };
    await addDoc(collection(db, 'enquiries'), data);
    console.log(`✅ [${i+1}] ${e.title}`);
    await new Promise(r => setTimeout(r, 200));
  }
  */
})();
```

## Option 2: Create Admin Page (Recommended)

I can create a simple admin page in your app that you can access to add these enquiries with one click. Would you like me to create that?

## Option 3: Firebase Admin SDK (Node.js)

If you prefer Node.js script, you'll need:
1. Firebase Admin SDK installed
2. Service account key from Firebase Console
3. Run: `node add-indian-enquiries.js`

---

**Note:** The browser console method requires access to your Firebase `db` instance. If your app doesn't expose it globally, I can create an admin page component that you can add to your app for easier access.




