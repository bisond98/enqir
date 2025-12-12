import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, HelpCircle, Search, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getAIConfig, getFallbackAIConfig } from '@/config/ai';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'quick-action' | 'suggestion';
}

const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Clear any existing localStorage chat data on mount
  useEffect(() => {
    if (user?.uid) {
      try {
        localStorage.removeItem(`enqir_chat_${user.uid}`);
      } catch (error) {
        // Ignore errors
      }
    }
  }, [user?.uid]);
  
  // SAFETY CHECK: Get AI config with error handling
  let aiConfig;
  try {
    aiConfig = getAIConfig();
  } catch (error) {
    console.error('Failed to get AI config:', error);
    aiConfig = getFallbackAIConfig();
    setHasError(true);
  }

  // Get current page context
  const getCurrentPageContext = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/post-enquiry') return 'post-enquiry';
    if (path === '/enquiry-wall' || path.includes('/enquiries')) return 'live-enquiries';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/profile') return 'profile';
    if (path === '/my-enquiries') return 'my-enquiries';
    if (path === '/my-responses') return 'my-responses';
    if (path === '/my-chats' || path.includes('/chat')) return 'chats';
    if (path.includes('/enquiry/') && path.includes('/responses')) return 'enquiry-detail';
    if (path.includes('/seller-response/')) return 'seller-response';
    if (path === '/help-guide') return 'help-guide';
    return 'unknown';
  };

  // Get user role context (buyer/seller/both)
  const getUserRole = () => {
    // For now, we'll assume users can be both buyers and sellers
    // This can be enhanced based on actual user profile data
    return 'both';
  };

  // Quick questions based on current page
  const getQuickQuestions = () => {
    const page = getCurrentPageContext();
    const role = getUserRole();
    
    const baseQuestions = {
      'home': [
        "Post enquiry",
        "Browse enquiries",
        "Trust badge",
        "Premium features",
        "How to use",
        "Dashboard"
      ],
      'post-enquiry': [
        "How to post enquiry",
        "Trust badge",
        "Premium benefits",
        "Required fields",
        "Upload ID",
        "Submit enquiry"
      ],
      'live-enquiries': [
        "Filter enquiries",
        "Search enquiries",
        "Trust badge filter",
        "Respond to enquiry",
        "View details",
        "Category filter"
      ],
      'dashboard': [
        "View enquiries",
        "View responses",
        "Track chats",
        "Premium upgrade",
        "Switch view",
        "Refresh data"
      ],
      'profile': [
        "Complete KYC",
        "Trust badge",
        "Profile verification",
        "Upload ID",
        "Edit profile",
        "Remove trust badge"
      ],
      'my-enquiries': [
        "View responses",
        "Upgrade to premium",
        "Track status",
        "Close enquiry",
        "Edit enquiry",
        "Delete enquiry"
      ],
      'my-responses': [
        "View enquiry",
        "Track status",
        "Edit response",
        "Delete response",
        "Chat with buyer",
        "View dashboard"
      ],
      'chats': [
        "Switch between chats",
        "Send message",
        "Quick messages",
        "View enquiry",
        "View response",
        "Close deal"
      ],
      'enquiry-detail': [
        "View responses",
        "Chat with seller",
        "Upgrade premium",
        "Filter responses",
        "Trust badge info",
        "Close enquiry"
      ],
      'seller-response': [
        "Submit response",
        "Add trust badge",
        "Upload images",
        "Set price",
        "Add description",
        "Required fields"
      ],
      'help-guide': [
        "Post enquiry",
        "Respond to enquiry",
        "Trust badge",
        "Premium",
        "Chat features",
        "Dashboard"
      ],
      'unknown': [
        "Post enquiry",
        "Browse enquiries",
        "Trust badge",
        "How to use",
        "Dashboard",
        "Contact support"
      ]
    };

    return baseQuestions[page] || baseQuestions['unknown'];
  };

  const quickQuestions = getQuickQuestions();

  // Comprehensive knowledge base for AI responses - covers all possible doubts
  const knowledgeBase: Record<string, { answer: string; actions?: string[]; navigateTo?: string }> = {
    // ========== POSTING ENQUIRY (Buyers) ==========
    "post enquiry": {
      answer: "To post an enquiry:\n\n1. Go to 'Post Enquiry' from menu or homepage\n2. Fill: Title, Description, Budget, Location\n3. (Optional) Upload ID for trust badge\n4. (Optional) Choose Premium for more than 2 responses\n5. Click 'Submit'\n\nAI verifies and matches you with sellers automatically!",
      actions: ["Go to Post Enquiry"],
      navigateTo: "/post-enquiry"
    },
    "how to post": {
      answer: "Posting: Go to 'Post Enquiry', fill what you need, budget, location. Add trust badge or premium optionally. AI handles the rest!",
      actions: ["Go to Post Enquiry"],
      navigateTo: "/post-enquiry"
    },
    "posting enquiry": {
      answer: "Post enquiry: Go to 'Post Enquiry', fill required details (title, description, budget, location). Optionally add trust badge or premium. Submit!",
      actions: ["Go to Post Enquiry"],
      navigateTo: "/post-enquiry"
    },
    "create enquiry": {
      answer: "Create enquiry: Go to 'Post Enquiry', fill what you need, budget, location. Add optional trust badge or premium. Submit!",
      actions: ["Go to Post Enquiry"],
      navigateTo: "/post-enquiry"
    },
    "new enquiry": {
      answer: "New enquiry: Go to 'Post Enquiry' from menu. Fill title, description, budget, location. Optionally add trust badge or premium. Submit!",
      actions: ["Go to Post Enquiry"],
      navigateTo: "/post-enquiry"
    },
    "required fields post": {
      answer: "Required to post: Title, Description, Budget, Location. Optional: Trust badge (upload ID), Premium (more responses), Notes, Reference images.",
      actions: ["Go to Post Enquiry"],
      navigateTo: "/post-enquiry"
    },
    "what needed post": {
      answer: "To post enquiry: Title (what you need), Description (details), Budget (your budget), Location (where you are). Optional: Trust badge, Premium, Notes.",
      actions: ["Go to Post Enquiry"],
      navigateTo: "/post-enquiry"
    },
    "post form fields": {
      answer: "Post enquiry form fields:\n\nRequired: Title, Description, Budget, Location\nOptional: Trust badge (ID upload), Premium plan, Notes, Reference images, Deadline",
      actions: ["Go to Post Enquiry"],
      navigateTo: "/post-enquiry"
    },
    "categories post": {
      answer: "Categories when posting: Select from dropdown (Jobs, Services, Real Estate, Antiques, Art, Automobile, etc.). You can select multiple categories.",
      actions: ["Go to Post Enquiry"],
      navigateTo: "/post-enquiry"
    },
    
    // ========== SELLING/RESPONDING (Sellers) ==========
    "respond to enquiry": {
      answer: "To respond:\n\n1. Go to 'Live Enquiries'\n2. Find enquiry you can help with\n3. Click 'Respond' or 'Sell'\n4. Fill: Price, Description, Upload images\n5. (Optional) Add trust badge\n6. Submit\n\nAI auto-approves quality responses!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "respond": {
      answer: "Responding: Browse 'Live Enquiries', click 'Respond' on matching enquiry, add price/description/images. Submit! AI approves instantly!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "how to respond": {
      answer: "To respond: Go to Live Enquiries, find what you can help with, click 'Respond', add price/description/images. Submit!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "how to sell": {
      answer: "To sell: Go to 'Live Enquiries', find enquiries you can help with, click 'Respond', fill price (required), description (required), upload images. Optional: trust badge, notes. Submit!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "sell": {
      answer: "To sell: Go to 'Live Enquiries', browse buyer enquiries, click 'Respond' on matching ones, add price/description/images. Submit!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "selling": {
      answer: "Selling: Go to Live Enquiries, find buyer enquiries you can fulfill, click 'Respond', add price/description/images. AI auto-approves!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "not posting my need": {
      answer: "To sell for others: Go to 'Live Enquiries' (not Post Enquiry), browse what buyers want, click 'Respond', fill price/description/images. Submit!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "sell for needs from others": {
      answer: "Sell for others: Go to 'Live Enquiries', find buyer enquiries, click 'Respond', add price/description/images. You're responding to buyers!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "required fields respond": {
      answer: "Required to respond: Price, Description, Product images. Optional: Trust badge (upload ID), Notes.",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "what needed respond": {
      answer: "To respond: Price (your offer), Description (product/service details), Product images (upload). Optional: Trust badge, Notes.",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "submit response": {
      answer: "Submit response: Fill price and description, upload product images, add notes if needed. Optional: Upload ID for trust badge. Click 'Submit'!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "response form": {
      answer: "Response form fields:\n\nRequired: Price, Description, Product images\nOptional: Trust badge (ID upload), Notes",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    
    // ========== TRUST BADGE ==========
    "trust badge": {
      answer: "Trust Badge:\n\n• Profile KYC: Complete in profile - applies to ALL enquiries/responses automatically. When done, forms show 'Profile Verified' instead of ID upload\n• Form Upload: Upload ID in form - only for that specific item (only shows if profile KYC not done)\n• Remove from profile anytime\n• Builds trust with buyers/sellers",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "kyc": {
      answer: "KYC verification: Complete in Profile (applies to all) or upload ID in form (for that item only). Upload ID document to get trust badge!",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "get trust badge": {
      answer: "Get trust badge: Go to Profile, upload ID document, complete verification. Or upload ID in enquiry/response form for that item only.",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "remove trust badge": {
      answer: "Remove trust badge: Go to Profile, find trust badge section, click remove. Removes from all activities. Can add back anytime!",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "trust badge difference": {
      answer: "Trust Badge difference:\n\n• Profile KYC: Applies to ALL enquiries/responses. When completed, forms show 'Profile Verified' instead of ID upload option. Remove anytime from profile.\n• Form Upload: Only for that specific enquiry/response. Only available if profile KYC is not done.",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "verify identity": {
      answer: "Verify identity: Complete KYC in Profile (applies to all) or upload ID in enquiry/response form (for that item only). Upload ID document!",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "trust badge profile vs form": {
      answer: "Trust badge:\n\nProfile KYC: Applies to all your enquiries and responses. Can remove anytime.\nForm Upload: Only for that specific enquiry or response.",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "which trust badge shows up": {
      answer: "If you completed KYC in profile AND uploaded ID in a form:\n\n• Profile KYC applies to ALL your enquiries/responses automatically\n• Form upload is only for that specific enquiry/response\n• When profile KYC is done, forms show 'Profile Verified' or 'Trust Badge Verified From Profile' instead of ID upload option\n• Both trust badges can appear - profile badge applies everywhere, form badge only for that item",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "profile verified in form": {
      answer: "When you complete KYC in your profile, the enquiry and response forms automatically show 'Profile Verified' or 'Trust Badge Verified From Profile' instead of the ID upload option. Your profile trust badge applies to all enquiries and responses automatically!",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    
    // ========== PREMIUM ==========
    "premium": {
      answer: "Premium: Get MORE than 2 responses from different sellers. Compare multiple offers. Better selection. Upgrade from enquiry or dashboard!",
      actions: ["Go to Dashboard"]
    },
    "premium benefits": {
      answer: "Premium benefits: More than 2 seller responses, compare different offers, better seller selection, more options. Upgrade anytime!",
      actions: ["Go to Dashboard"]
    },
    "upgrade premium": {
      answer: "Upgrade Premium: Go to enquiry in Dashboard, click 'Upgrade to Premium', select payment method (Razorpay), get more than 2 responses!",
      actions: ["Go to Dashboard"]
    },
    "premium cost": {
      answer: "Premium pricing: Different plans available. Check when upgrading from enquiry or dashboard. Payment via Razorpay. Get more than 2 responses!",
      actions: ["Go to Dashboard"]
    },
    "free vs premium": {
      answer: "Free vs Premium:\n\n• Free: Up to 2 responses\n• Premium: More than 2 responses\n• Premium lets you compare multiple offers\n• Better selection with Premium",
      actions: ["Go to Dashboard"]
    },
    "why premium": {
      answer: "Why Premium: Free plan gives up to 2 responses. Premium gives MORE than 2 responses so you can compare multiple seller offers and choose the best!",
      actions: ["Go to Dashboard"]
    },
    "premium payment": {
      answer: "Premium payment: Pay via Razorpay when upgrading. Select plan, enter payment details, complete payment. Your enquiry gets upgraded instantly!",
      actions: ["Go to Dashboard"]
    },
    "when upgrade premium": {
      answer: "When to upgrade: Upgrade when posting new enquiry or from existing enquiry in Dashboard. Get more than 2 responses to compare offers!",
      actions: ["Go to Dashboard"]
    },
    
    // ========== DASHBOARD ==========
    "dashboard": {
      answer: "Dashboard: View all enquiries, see all responses, track chats, switch buyer/seller view, upgrade premium. Your control center!",
      actions: ["Go to Dashboard"],
      navigateTo: "/dashboard"
    },
    "view dashboard": {
      answer: "Dashboard shows: All posted enquiries, all responses received/sent, active chats, premium status. Switch between buyer/seller views!",
      actions: ["Go to Dashboard"],
      navigateTo: "/dashboard"
    },
    "switch view dashboard": {
      answer: "Switch view: In Dashboard, use toggle to switch between 'Buyer View' (your enquiries) and 'Seller View' (your responses).",
      actions: ["Go to Dashboard"],
      navigateTo: "/dashboard"
    },
    "refresh dashboard": {
      answer: "Refresh dashboard: Click refresh button in dashboard header to reload all data. Shows latest enquiries, responses, chats!",
      actions: ["Go to Dashboard"],
      navigateTo: "/dashboard"
    },
    "buyer view seller view": {
      answer: "Dashboard views:\n\n• Buyer View: Shows all enquiries you posted and responses you received\n• Seller View: Shows all responses you sent to buyers\n\nSwitch using toggle!",
      actions: ["Go to Dashboard"],
      navigateTo: "/dashboard"
    },
    "track enquiries": {
      answer: "Track enquiries: Go to Dashboard, see all your posted enquiries with response counts, status, premium info. Click any to view details!",
      actions: ["Go to Dashboard"],
      navigateTo: "/dashboard"
    },
    "track responses": {
      answer: "Track responses: Go to Dashboard, switch to Seller View, see all responses you sent. View status, chat with buyers, manage offers!",
      actions: ["Go to Dashboard"],
      navigateTo: "/dashboard"
    },
    
    // ========== BROWSE/LIVE ENQUIRIES ==========
    "browse enquiries": {
      answer: "Browse Live Enquiries: Use search bar, filter by category, filter by trust badge, switch grid/list view. Click enquiry to see details or 'Respond' to send offer.",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "find enquiries": {
      answer: "Find enquiries: Go to 'Live Enquiries', use search (matches title/description/category), filter by trust badge or category. Click to view details!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "search enquiries": {
      answer: "Search enquiries: In Live Enquiries, use search bar. Matches title, description, category. Also has AI search for smart matching!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "filter enquiries": {
      answer: "Filter enquiries:\n\n• By category (dropdown)\n• By trust badge (filter icon)\n• By search term\n• Switch grid/list view\n\nAll filters work together!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "trust badge filter": {
      answer: "Trust badge filter: In Live Enquiries, click filter icon (left of grid/list toggle). Shows 'Trust badge only' when inactive, 'Remove filter' when active. Filter shows only enquiries with trust badge!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "category filter": {
      answer: "Category filter: In Live Enquiries, use category dropdown to filter by specific category. Works with search and trust badge filter!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "grid list view": {
      answer: "Grid/List view: In Live Enquiries, toggle between grid view (cards) and list view (compact list). Choose what works best for you!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "ai search": {
      answer: "AI search: In Live Enquiries search bar, AI helps find relevant enquiries even if exact words don't match. Works with regular search!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "live enquiries": {
      answer: "Live Enquiries: Browse all active enquiries from buyers. Search, filter by category/trust badge, switch views. Click to see details or respond!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    
    // ========== CHATS ==========
    "chat": {
      answer: "Chat features:\n\n• Go to 'My Chats' to see all conversations\n• Switch between different sellers/buyers\n• Use quick message buttons (Payment, Delivery, etc.)\n• Send images and messages\n• View enquiry/response details from chat\n• Close deals directly",
      actions: ["Go to My Chats"]
    },
    "switch between chats": {
      answer: "Switch chats: In My Chats, see all active conversations. Click any chat to open it. Switch between different sellers/buyers easily!",
      actions: ["Go to My Chats"]
    },
    "my chats": {
      answer: "My Chats shows:\n\n• All conversations\n• Unread message counts\n• Switch between chats easily\n• Quick message buttons\n• View enquiry/response from chat\n• Close deals",
      actions: ["Go to My Chats"]
    },
    "quick messages": {
      answer: "Quick messages in chat:\n\nFor Sellers: Payment, Delivery, Bulk, Quality, Meetup, Samples\nFor Buyers: Pricing, Timeline, Images, Terms, Meetup\n\nClick buttons to send pre-written messages instantly!",
      actions: ["Go to My Chats"]
    },
    "send message": {
      answer: "Send message: In chat, type your message in input box, click send or press Enter. Can also send images. Use quick message buttons for common questions!",
      actions: ["Go to My Chats"]
    },
    "chat with seller": {
      answer: "Chat with seller: From your enquiry responses page, click on any seller response to open chat. Use quick messages or type custom messages!",
      actions: ["Go to My Chats"]
    },
    "chat with buyer": {
      answer: "Chat with buyer: From My Responses or when buyer clicks your response, chat opens. Use quick messages for common questions or type custom messages!",
      actions: ["Go to My Chats"]
    },
    "unread messages": {
      answer: "Unread messages: In My Chats, see unread count badge on each chat. Click chat to read messages. Badge updates automatically!",
      actions: ["Go to My Chats"]
    },
    "close deal": {
      answer: "Close deal: In chat, discuss terms with buyer/seller. When agreed, you can mark enquiry as closed from enquiry detail page or dashboard.",
      actions: ["Go to My Chats"]
    },
    
    // ========== ENQUIRY DETAIL PAGE ==========
    "enquiry detail": {
      answer: "Enquiry detail page:\n\n• See all seller responses\n• Filter responses\n• Chat with sellers\n• Upgrade to premium\n• View trust badges\n• Compare offers\n• Close enquiry when done",
      actions: ["Go to Dashboard"]
    },
    "view responses": {
      answer: "View responses: Go to your enquiry (from Dashboard or My Enquiries), see all seller responses. Filter by trust badge, click to chat, compare offers!",
      actions: ["Go to Dashboard"]
    },
    "filter responses": {
      answer: "Filter responses: On enquiry detail page, filter responses by trust badge. See only verified sellers or all sellers. Compare offers easily!",
      actions: ["Go to Dashboard"]
    },
    "compare offers": {
      answer: "Compare offers: On enquiry detail page, see all seller responses with prices, descriptions, images. Filter by trust badge. Click to chat with sellers!",
      actions: ["Go to Dashboard"]
    },
    "close enquiry": {
      answer: "Close enquiry: On enquiry detail page or Dashboard, find close/deal closed option. Mark enquiry as closed when you've finalized a deal!",
      actions: ["Go to Dashboard"]
    },
    
    // ========== PROFILE ==========
    "profile": {
      answer: "Your Profile:\n\n• Complete KYC for trust badge\n• Trust badge applies to all activities\n• Upload/remove ID anytime\n• Edit your information\n• View verification status",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "complete kyc": {
      answer: "Complete KYC: Go to Profile, upload ID document (front and back), complete verification. Trust badge applies to all enquiries/responses!",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "edit profile": {
      answer: "Edit profile: Go to Profile, update your information. Complete KYC for trust badge. Upload or remove ID anytime!",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "profile verification": {
      answer: "Profile verification: Complete KYC in Profile by uploading ID documents. Once verified, trust badge applies to all your activities automatically!",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    
    // ========== MY ENQUIRIES ==========
    "my enquiries": {
      answer: "My Enquiries shows:\n\n• All enquiries you posted\n• Response counts\n• Status of each enquiry\n• Upgrade to premium\n• View/edit/delete enquiries\n• Track all activity",
      actions: ["Go to My Enquiries"]
    },
    "view my enquiries": {
      answer: "View my enquiries: Go to 'My Enquiries' from menu. See all enquiries you posted with response counts, status, premium info. Click to view details!",
      actions: ["Go to My Enquiries"]
    },
    "edit enquiry": {
      answer: "Edit enquiry: Go to My Enquiries or Dashboard, find your enquiry, click edit. Update title, description, budget, location, etc. Save changes!",
      actions: ["Go to My Enquiries"]
    },
    "delete enquiry": {
      answer: "Delete enquiry: Go to My Enquiries or Dashboard, find your enquiry, click delete. Confirm deletion. Enquiry will be removed!",
      actions: ["Go to My Enquiries"]
    },
    "enquiry status": {
      answer: "Enquiry status: See status in My Enquiries or Dashboard. Shows if enquiry is live, has responses, is premium, or closed. Track everything!",
      actions: ["Go to My Enquiries"]
    },
    
    // ========== MY RESPONSES ==========
    "my responses": {
      answer: "My Responses shows:\n\n• All responses you sent\n• Status of each response\n• View original enquiry\n• Chat with buyers\n• Edit/delete responses\n• Track all your offers",
      actions: ["Go to My Responses"]
    },
    "view my responses": {
      answer: "View my responses: Go to 'My Responses' from menu. See all responses you sent with status, original enquiry link. Click to view or chat!",
      actions: ["Go to My Responses"]
    },
    "edit response": {
      answer: "Edit response: Go to My Responses, find your response, click edit. Update price, description, images. Save changes!",
      actions: ["Go to My Responses"]
    },
    "delete response": {
      answer: "Delete response: Go to My Responses, find your response, click delete. Confirm deletion. Response will be removed!",
      actions: ["Go to My Responses"]
    },
    "response status": {
      answer: "Response status: In My Responses, see if your response is approved, pending, or if buyer has chatted. Track all your offers!",
      actions: ["Go to My Responses"]
    },
    
    // ========== SAVED ENQUIRIES ==========
    "saved enquiries": {
      answer: "Saved Enquiries: Save enquiries you're interested in. Click bookmark icon on any enquiry to save. View all saved in 'Saved Enquiries' page!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "save enquiry": {
      answer: "Save enquiry: On any enquiry card or detail page, click bookmark/save icon. Enquiry is saved. View all saved in Saved Enquiries page!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "bookmark enquiry": {
      answer: "Bookmark enquiry: Click bookmark icon on enquiry to save it. View all bookmarked enquiries in Saved Enquiries page. Click again to unsave!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "view saved": {
      answer: "View saved: Go to Saved Enquiries page (if available in menu) or check your saved list. See all enquiries you bookmarked!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    
    // ========== SETTINGS ==========
    "settings": {
      answer: "Settings: Manage your account preferences, notifications, privacy settings. Go to Settings from menu to update your preferences!",
      actions: ["Go to Profile"]
    },
    "notification settings": {
      answer: "Notification settings: Go to Settings, toggle notifications on/off. Control if you receive notifications about enquiries, responses, chats!",
      actions: ["Go to Profile"]
    },
    "privacy settings": {
      answer: "Privacy settings: Go to Settings, manage profile visibility, data collection preferences. Control your privacy!",
      actions: ["Go to Profile"]
    },
    "change password": {
      answer: "Change password: Go to Settings or use 'Forgot Password' from sign in page. Reset your password via email link!",
      actions: ["Go to Profile"]
    },
    
    // ========== NOTIFICATIONS ==========
    "notifications": {
      answer: "Notifications: Get notified about new responses, messages, enquiry updates. View all in Notifications page. Toggle on/off in Settings!",
      actions: ["Go to Profile"]
    },
    "view notifications": {
      answer: "View notifications: Go to Notifications page from menu. See all your notifications. Mark as read, clear all. Stay updated!",
      actions: ["Go to Profile"]
    },
    "notification badge": {
      answer: "Notification badge: See unread count on notification icon in header. Click to view notifications. Badge updates automatically!",
      actions: ["Go to Profile"]
    },
    
    // ========== AI FEATURES ==========
    "ai features": {
      answer: "AI features in Enqir:\n\n• AI verifies enquiries automatically\n• AI auto-approves quality responses\n• AI search for smart matching\n• AI filters spam and fake accounts\n• AI helps match buyers with sellers",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    "ai verification": {
      answer: "AI verification: Our AI automatically verifies your enquiry when you post it. Also auto-approves quality seller responses instantly!",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    "ai search": {
      answer: "AI search: In Live Enquiries, AI search helps find relevant enquiries even if exact words don't match. Works with regular search!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "how ai helps": {
      answer: "How AI helps:\n\n• Verifies enquiries automatically\n• Auto-approves quality responses\n• Smart search matching\n• Filters spam\n• Matches buyers with right sellers",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    
    // ========== PAYMENT ==========
    "payment": {
      answer: "Payment: Premium upgrades use Razorpay for secure payment. Select plan, enter payment details, complete payment. Your enquiry gets upgraded instantly!",
      actions: ["Go to Dashboard"]
    },
    "razorpay": {
      answer: "Razorpay: Secure payment gateway for Premium upgrades. Select plan, Razorpay opens, enter card details, complete payment. Instant upgrade!",
      actions: ["Go to Dashboard"]
    },
    "payment failed": {
      answer: "Payment failed: Check your internet connection, card details, sufficient balance. Try again. If issue persists, contact support!",
      actions: ["Go to Dashboard"]
    },
    "refund": {
      answer: "Refund: Check Refund Policy page for refund terms. Contact support if you need refund assistance. Payment issues are handled securely!",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    
    // ========== GENERAL HELP ==========
    "how to use": {
      answer: "How to use Enqir:\n\nFor Buyers:\n• Post your enquiry\n• Get responses from sellers\n• Chat and close deals\n\nFor Sellers:\n• Browse live enquiries\n• Respond with your offer\n• Chat with buyers\n• Close sales\n\nAI helps match and verify everything!",
      actions: ["View Help Guide", "Go to Dashboard"],
      navigateTo: "/help-guide"
    },
    "help": {
      answer: "I'm here to help! Ask me about:\n\n• Posting enquiries\n• Responding to enquiries\n• Trust badges\n• Premium features\n• Dashboard\n• Chats\n• Search & filters\n• Any feature!\n\nWhat do you need help with?",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    "contact support": {
      answer: "For support:\n\n• Use this chat assistant\n• Check the Help Guide\n• All features are explained\n\nI can help you with anything about the app!",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    "help guide": {
      answer: "Help Guide: Comprehensive guide covering all features. Go to Help Guide page for detailed instructions on using Enqir for buyers and sellers!",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    "what is enqir": {
      answer: "Enqir: A platform connecting buyers and sellers. Buyers post what they need, sellers respond with offers. AI helps verify and match. Chat to close deals!",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    "how it works": {
      answer: "How Enqir works:\n\nBuyers: Post enquiry → Get responses → Chat → Close deal\nSellers: Browse enquiries → Respond → Chat → Close sale\n\nAI verifies and matches automatically!",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    
    // ========== TROUBLESHOOTING ==========
    "not working": {
      answer: "If something's not working:\n\n• Refresh the page\n• Check internet connection\n• Clear browser cache\n• Try again\n• Contact support if issue persists",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    "error": {
      answer: "If you see an error:\n\n• Refresh the page\n• Check your internet\n• Try again in a moment\n• Clear browser cache\n• Contact support if it continues",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    "can't post": {
      answer: "Can't post enquiry:\n\n• Check all required fields are filled\n• Check internet connection\n• Make sure you're signed in\n• Try refreshing page\n• Contact support if issue persists",
      actions: ["Go to Post Enquiry"],
      navigateTo: "/post-enquiry"
    },
    "can't respond": {
      answer: "Can't respond:\n\n• Check all required fields (price, description, images)\n• Check internet connection\n• Make sure you're signed in\n• Try refreshing page",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "no responses": {
      answer: "No responses yet:\n\n• Wait a bit - sellers need time to respond\n• Upgrade to Premium to get more than 2 responses\n• Check your enquiry is clear and complete",
      actions: ["Go to Dashboard"]
    },
    "response not approved": {
      answer: "Response not approved:\n\n• AI approves quality responses automatically\n• Make sure your response has clear price, description, and images\n• Try again with complete details",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    
    // ========== REPORT USER ==========
    "report user": {
      answer: "Report user: In chat dropdown menu, click 'Report'. Select reason, add details, submit. Admin will review the report. Keep the community safe!",
      actions: ["Go to My Chats"]
    },
    "report": {
      answer: "Report: In chat, click dropdown menu (three dots), select 'Report'. Choose reason, add details, submit report. Admin reviews all reports!",
      actions: ["Go to My Chats"]
    },
    
    // ========== SIGN IN/SIGN UP ==========
    "sign in": {
      answer: "Sign in: Go to Sign In page, enter email/phone and password. Or use social login. Access all features after signing in!",
      actions: ["Go to Profile"]
    },
    "sign up": {
      answer: "Sign up: Create account with email/phone and password. Verify email if required. Start posting enquiries or responding to buyers!",
      actions: ["Go to Profile"]
    },
    "forgot password": {
      answer: "Forgot password: Go to Sign In page, click 'Forgot Password', enter email. Check email for reset link. Create new password!",
      actions: ["Go to Profile"]
    },
    "reset password": {
      answer: "Reset password: Click link in email from 'Forgot Password'. Enter new password, confirm. Sign in with new password!",
      actions: ["Go to Profile"]
    },
    
    // ========== POLICIES ==========
    "terms conditions": {
      answer: "Terms & Conditions: View Terms and Conditions page for usage terms, user responsibilities, platform rules. Important to read!",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    "privacy policy": {
      answer: "Privacy Policy: View Privacy Policy page for how we handle your data, what we collect, how we protect it. Your privacy matters!",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    "refund policy": {
      answer: "Refund Policy: View Refund Policy page for refund terms, conditions, process. Check before making premium payments!",
      actions: ["View Help Guide"],
      navigateTo: "/help-guide"
    },
    
    // ========== QUICK QUESTIONS VARIATIONS ==========
    "where post": {
      answer: "Where to post: Go to 'Post Enquiry' from menu or homepage. Fill form and submit!",
      actions: ["Go to Post Enquiry"],
      navigateTo: "/post-enquiry"
    },
    "where respond": {
      answer: "Where to respond: Go to 'Live Enquiries' (Browse Enquiries), find matching enquiry, click 'Respond', fill form, submit!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "where chat": {
      answer: "Where to chat: Go to 'My Chats' from menu. See all conversations. Click any chat to open and message!",
      actions: ["Go to My Chats"]
    },
    "where dashboard": {
      answer: "Where is dashboard: Go to 'Dashboard' from menu. Your control center for all enquiries, responses, and chats!",
      actions: ["Go to Dashboard"],
      navigateTo: "/dashboard"
    },
    "where profile": {
      answer: "Where is profile: Go to 'Profile' from menu. Complete KYC, manage trust badge, edit your information!",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "where settings": {
      answer: "Where are settings: Go to 'Settings' from menu (if available) or check Profile page. Manage notifications and preferences!",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    
    // ========== COMMON QUESTIONS ==========
    "how many responses": {
      answer: "How many responses:\n\n• Free: Up to 2 responses\n• Premium: More than 2 responses\n\nUpgrade to Premium to get more options and compare offers!",
      actions: ["Go to Dashboard"]
    },
    "is it free": {
      answer: "Is it free: Yes! Basic features are free. You can post enquiries and get up to 2 responses for free. Premium gives more than 2 responses!",
      actions: ["Go to Dashboard"]
    },
    "how much premium": {
      answer: "Premium cost: Different plans available. Check pricing when upgrading from your enquiry or dashboard. Payment via Razorpay!",
      actions: ["Go to Dashboard"]
    },
    "what categories": {
      answer: "Categories: Jobs, Services, Real Estate, Antiques, Art, Automobile, Books, Collectibles, Electronics, Fashion, Home, Jewelry, and more. Select when posting!",
      actions: ["Go to Post Enquiry"],
      navigateTo: "/post-enquiry"
    },
    "can i edit": {
      answer: "Can you edit: Yes! Edit enquiries from My Enquiries or Dashboard. Edit responses from My Responses. Update details anytime!",
      actions: ["Go to Dashboard"]
    },
    "can i delete": {
      answer: "Can you delete: Yes! Delete enquiries from My Enquiries or Dashboard. Delete responses from My Responses. Confirm before deleting!",
      actions: ["Go to Dashboard"]
    },
    "how to contact buyer": {
      answer: "Contact buyer: When buyer clicks your response, chat opens automatically. Or go to My Responses, click on your response, chat with buyer!",
      actions: ["Go to My Responses"]
    },
    "how to contact seller": {
      answer: "Contact seller: From your enquiry responses page, click on any seller response. Chat opens automatically. Message the seller!",
      actions: ["Go to Dashboard"]
    },
    "what is trust badge": {
      answer: "Trust Badge: Shows you're verified. Complete KYC in profile (applies to all) or upload ID in form (for that item only). Builds trust!",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "why trust badge": {
      answer: "Why trust badge: Builds trust with buyers/sellers. Shows you're verified. Buyers prefer sellers with trust badge. Optional but recommended!",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "how long verification": {
      answer: "Verification time: Usually instant or very quick. AI verifies your enquiry and seller responses automatically. Trust badge verification is also fast!",
      actions: ["Go to Profile"],
      navigateTo: "/profile"
    },
    "what happens after post": {
      answer: "After posting:\n\n• AI verifies your enquiry\n• Enquiry goes live\n• Sellers can see and respond\n• You get notifications\n• View responses in Dashboard",
      actions: ["Go to Dashboard"]
    },
    "what happens after respond": {
      answer: "After responding:\n\n• AI auto-approves quality response\n• Buyer sees your response\n• Buyer can chat with you\n• Close the deal in chat",
      actions: ["Go to My Responses"]
    },
    "how to get more responses": {
      answer: "Get more responses: Upgrade to Premium! Free gives up to 2 responses. Premium gives MORE than 2 responses so you can compare offers!",
      actions: ["Go to Dashboard"]
    },
    "only getting 2 responses": {
      answer: "Only getting 2 responses: That's the free plan limit. Upgrade to Premium to get MORE than 2 responses from different sellers. Compare multiple offers and choose the best!",
      actions: ["Go to Dashboard"]
    },
    "only 2 responses": {
      answer: "Only 2 responses: Free plan gives up to 2 responses. Upgrade to Premium for MORE than 2 responses. Compare different seller offers!",
      actions: ["Go to Dashboard"]
    },
    "get more sellers to respond": {
      answer: "Get more sellers to respond: Upgrade to Premium! Free gives up to 2 responses. Premium gives MORE than 2 responses from different sellers so you can compare offers!",
      actions: ["Go to Dashboard"]
    },
    "more sellers respond": {
      answer: "More sellers respond: Upgrade to Premium! You'll get MORE than 2 responses from different sellers. Compare multiple offers and choose the best deal!",
      actions: ["Go to Dashboard"]
    },
    "compare different offers": {
      answer: "Compare offers: Upgrade to Premium to get MORE than 2 responses. With multiple seller responses, you can compare prices, descriptions, and choose the best offer!",
      actions: ["Go to Dashboard"]
    },
    "compare offers": {
      answer: "Compare offers: Upgrade to Premium to get MORE than 2 responses. Compare prices, descriptions, images from different sellers. Choose the best deal!",
      actions: ["Go to Dashboard"]
    },
    "posted enquiry getting 2 responses": {
      answer: "Getting only 2 responses: That's the free plan limit. Upgrade to Premium from your Dashboard to get MORE than 2 responses. Compare multiple seller offers!",
      actions: ["Go to Dashboard"]
    },
    "posted enquiry only 2": {
      answer: "Only 2 responses: Free plan limit. Upgrade to Premium in Dashboard to get MORE than 2 responses from different sellers. Compare offers!",
      actions: ["Go to Dashboard"]
    },
    "how to find buyers": {
      answer: "Find buyers: Go to Live Enquiries, browse all buyer enquiries. Use search and filters to find matching enquiries. Respond to get buyers!",
      actions: ["Go to Live Enquiries"],
      navigateTo: "/enquiry-wall"
    },
    "how to find sellers": {
      answer: "Find sellers: Post your enquiry. Sellers will respond. View all responses in your enquiry detail page. Chat with sellers to close deal!",
      actions: ["Go to Post Enquiry"],
      navigateTo: "/post-enquiry"
    }
  };

  // Clear messages when chat closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
    }
  }, [isOpen]);

  // Initialize with context-aware welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const currentPage = getCurrentPageContext();
      let welcomeMessage = "Hello! I'm your Enqir Assistant. ";
      
      if (currentPage === 'post-enquiry') {
        welcomeMessage += "I see you're posting an enquiry. I can help you with:\n\n• Filling the form\n• Trust badge\n• Premium features\n• Any questions!";
      } else if (currentPage === 'live-enquiries') {
        welcomeMessage += "I see you're browsing enquiries. I can help you with:\n\n• Finding specific enquiries\n• Filtering\n• Responding\n• Trust badges";
      } else if (currentPage === 'dashboard') {
        welcomeMessage += "I see you're on your dashboard. I can help you with:\n\n• Viewing enquiries/responses\n• Premium upgrade\n• Switching views\n• Managing everything";
      } else if (currentPage === 'chats') {
        welcomeMessage += "I see you're in chats. I can help you with:\n\n• Switching between chats\n• Using quick messages\n• Viewing details\n• Closing deals";
      } else {
        welcomeMessage += "I can help you with:\n\n• Posting enquiries\n• Responding to enquiries\n• Trust badges\n• Premium features\n• Dashboard\n• Chats\n• Everything!";
      }
      
      welcomeMessage += "\n\nWhat would you like to know?";
      addBotMessage(welcomeMessage, "text");
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add message to chat
  const addMessage = (text: string, sender: 'user' | 'bot', type: 'text' | 'quick-action' | 'suggestion' = 'text') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Add bot message with typing effect
  const addBotMessage = (text: string, type: 'text' | 'quick-action' | 'suggestion' = 'text') => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(text, 'bot', type);
    }, 1000);
  };

  // Handle user input with SAFETY FALLBACK
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      const userMessage = inputText.trim();
      addMessage(userMessage, 'user');
      setInputText('');
      setIsLoading(true);

      // Simulate AI processing
      setTimeout(() => {
        try {
          const response = generateAIResponse(userMessage.toLowerCase());
          addBotMessage(response.answer, 'text');
          
          // Add quick actions if available
          if (response.actions && response.actions.length > 0) {
            setTimeout(() => {
              addBotMessage("Here are some quick actions:", 'suggestion');
              response.actions.forEach(action => {
                addBotMessage(action, 'quick-action');
              });
            }, 500);
          }

          // Don't auto-navigate - let user decide via action buttons
        } catch (error) {
          console.error('AI response generation failed:', error);
          addBotMessage("I'm having trouble right now. You can still use all app features normally!", 'text');
        } finally {
          setIsLoading(false);
        }
      }, 1500);
    } catch (error) {
      console.error('Message handling failed:', error);
      setIsLoading(false);
      addBotMessage("Something went wrong. Please try again or use the app normally.", 'text');
    }
  };

  // Generate AI response based on user input with context awareness
  const generateAIResponse = (input: string) => {
    try {
      // SAFETY CHECK: Validate input
      if (!input || typeof input !== 'string') {
        return getFallbackResponse();
      }

      const lowerInput = input.toLowerCase();
      const currentPage = getCurrentPageContext();
      const userRole = getUserRole();

      // Context-aware responses based on current page
      let contextHint = '';
      if (currentPage === 'post-enquiry') {
        contextHint = " You're on the Post Enquiry page. ";
      } else if (currentPage === 'live-enquiries') {
        contextHint = " You're browsing enquiries. ";
      } else if (currentPage === 'dashboard') {
        contextHint = " You're on your Dashboard. ";
      } else if (currentPage === 'chats') {
        contextHint = " You're in My Chats. ";
      } else if (currentPage === 'enquiry-detail') {
        contextHint = " You're viewing an enquiry. ";
      } else if (currentPage === 'seller-response') {
        contextHint = " You're responding to an enquiry. ";
      }

      // Enhanced matching algorithm for complex questions
      
      // 1. Exact match first (highest priority)
      if (knowledgeBase[lowerInput.trim()]) {
        const data = knowledgeBase[lowerInput.trim()];
        return {
          ...data,
          answer: contextHint + data.answer
        };
      }
      
      // 2. Priority phrases (buyer questions first, then seller questions)
      const buyerPriorityPhrases = [
        "only getting 2 responses",
        "only 2 responses",
        "get more sellers to respond",
        "more sellers respond",
        "compare different offers",
        "compare offers",
        "posted enquiry getting 2 responses",
        "posted enquiry only 2",
        "how to get more responses",
        "getting only 2",
        "want more responses",
        "need more responses"
      ];
      
      const sellerPriorityPhrases = [
        "not posting my need",
        "sell for needs from others",
        "how to sell",
        "selling",
        "respond to enquiry",
        "how to respond",
        "respond"
      ];
      
      const trustBadgePriorityPhrases = [
        "which trust badge shows up",
        "profile verified",
        "completed kyc in my profile",
        "uploaded id in form",
        "profile one apply",
        "trust badge verified from profile"
      ];
      
      // Check buyer questions first (to avoid matching "respond" in buyer context)
      for (const phrase of buyerPriorityPhrases) {
        if (lowerInput.includes(phrase) || phrase.includes(lowerInput)) {
          const data = knowledgeBase[phrase];
          if (data) {
            return {
              ...data,
              answer: contextHint + data.answer
            };
          }
        }
      }
      
      // Then check seller questions
      for (const phrase of sellerPriorityPhrases) {
        if (lowerInput.includes(phrase) || phrase.includes(lowerInput)) {
          const data = knowledgeBase[phrase];
          if (data) {
            return {
              ...data,
              answer: contextHint + data.answer
            };
          }
        }
      }
      
      // Check trust badge specific questions
      for (const phrase of trustBadgePriorityPhrases) {
        if (lowerInput.includes(phrase) || phrase.includes(lowerInput)) {
          // Try to match the full question first
          if (lowerInput.includes("which trust badge") || lowerInput.includes("profile verified") || (lowerInput.includes("completed kyc") && lowerInput.includes("uploaded id"))) {
            const data = knowledgeBase["which trust badge shows up"];
            if (data) {
              return {
                ...data,
                answer: contextHint + data.answer
              };
            }
          }
          // Otherwise try profile verified
          if (lowerInput.includes("profile verified") || lowerInput.includes("verified from profile")) {
            const data = knowledgeBase["profile verified in form"];
            if (data) {
              return {
                ...data,
                answer: contextHint + data.answer
              };
            }
          }
        }
      }
      
      const priorityPhrases = [...buyerPriorityPhrases, ...sellerPriorityPhrases, ...trustBadgePriorityPhrases];
      
      for (const phrase of priorityPhrases) {
        if (lowerInput.includes(phrase) || phrase.includes(lowerInput)) {
          const data = knowledgeBase[phrase];
          if (data) {
            return {
              ...data,
              answer: contextHint + data.answer
            };
          }
        }
      }

      // 3. Context-aware matching (detect buyer vs seller intent)
      // If user mentions "posted enquiry" or "my enquiry" or "getting responses", they're a buyer
      const isBuyerContext = lowerInput.includes('posted enquiry') || 
                            lowerInput.includes('my enquiry') || 
                            lowerInput.includes('getting responses') ||
                            lowerInput.includes('only getting') ||
                            lowerInput.includes('only 2 responses') ||
                            lowerInput.includes('get more sellers') ||
                            lowerInput.includes('compare offers');
      
      // If user mentions "respond" but in buyer context, prioritize buyer answers
      if (isBuyerContext && lowerInput.includes('respond')) {
        // Look for buyer-related responses first
        const buyerKeys = Object.keys(knowledgeBase).filter(k => 
          k.includes('more responses') || 
          k.includes('premium') || 
          k.includes('compare') ||
          k.includes('only 2')
        );
        
        for (const key of buyerKeys) {
          if (lowerInput.includes(key) || key.includes(lowerInput.split(' ').slice(0, 3).join(' '))) {
            const data = knowledgeBase[key];
            return {
              ...data,
              answer: contextHint + data.answer
            };
          }
        }
      }
      
      // 4. Multi-word phrase matching (check if key phrase exists in input)
      const sortedKeys = Object.keys(knowledgeBase).sort((a, b) => b.split(' ').length - a.split(' ').length);
      
      for (const key of sortedKeys) {
        if (priorityPhrases.includes(key)) continue;
        
        const keyWords = key.split(' ').filter(w => w.length > 2); // Ignore short words
        if (keyWords.length === 0) continue;
        
        // Check if all key words appear in input (fuzzy match)
        const allWordsMatch = keyWords.every(kw => 
          lowerInput.includes(kw) || 
          lowerInput.split(' ').some(iw => iw.includes(kw) || kw.includes(iw))
        );
        
        if (allWordsMatch && keyWords.length > 0) {
          const data = knowledgeBase[key];
          return {
            ...data,
            answer: contextHint + data.answer
          };
        }
      }

      // 4. Single word matching (fallback)
      for (const [key, data] of Object.entries(knowledgeBase)) {
        if (priorityPhrases.includes(key)) continue;
        
        const keyWords = key.split(' ').filter(w => w.length > 2);
        const inputWords = lowerInput.split(' ').filter(w => w.length > 2);
        
        // Check if any key word matches any input word
        const matches = keyWords.some(kw => 
          inputWords.some(iw => iw.includes(kw) || kw.includes(iw)) || 
          lowerInput.includes(kw)
        );
        
        if (matches) {
          return {
            ...data,
            answer: contextHint + data.answer
          };
        }
      }
      
      // 5. Partial phrase matching (for questions like "how do I...", "what is...", "where can...")
      const questionPatterns = [
        { pattern: /how (do|can|to|do i|does)/i, remove: /^(how (do|can|to|do i|does) )/i },
        { pattern: /what (is|are|does|do|can)/i, remove: /^(what (is|are|does|do|can) )/i },
        { pattern: /where (is|are|can|do)/i, remove: /^(where (is|are|can|do) )/i },
        { pattern: /why (is|are|do|does)/i, remove: /^(why (is|are|do|does) )/i },
        { pattern: /can i/i, remove: /^(can i )/i },
        { pattern: /how many/i, remove: /^(how many )/i },
        { pattern: /how much/i, remove: /^(how much )/i }
      ];
      
      for (const { pattern, remove } of questionPatterns) {
        if (pattern.test(lowerInput)) {
          const cleanedInput = lowerInput.replace(remove, '').trim();
          
          // Try to match cleaned input
          for (const [key, data] of Object.entries(knowledgeBase)) {
            if (priorityPhrases.includes(key)) continue;
            
            if (cleanedInput.includes(key) || key.includes(cleanedInput)) {
              return {
                ...data,
                answer: contextHint + data.answer
              };
            }
            
            // Check word overlap
            const keyWords = key.split(' ').filter(w => w.length > 2);
            const cleanedWords = cleanedInput.split(' ').filter(w => w.length > 2);
            
            if (keyWords.some(kw => cleanedWords.some(cw => cw.includes(kw) || kw.includes(cw)))) {
              return {
                ...data,
                answer: contextHint + data.answer
              };
            }
          }
        }
      }

      // Default response with context - provide helpful suggestions
      const suggestions = [];
      if (lowerInput.includes('post') || lowerInput.includes('enquiry')) {
        suggestions.push("Try: 'how to post enquiry' or 'post enquiry'");
      } else if (lowerInput.includes('respond') || lowerInput.includes('sell') || lowerInput.includes('offer')) {
        suggestions.push("Try: 'how to respond' or 'how to sell'");
      } else if (lowerInput.includes('trust') || lowerInput.includes('kyc') || lowerInput.includes('verify')) {
        suggestions.push("Try: 'trust badge' or 'how to get trust badge'");
      } else if (lowerInput.includes('premium') || lowerInput.includes('upgrade')) {
        suggestions.push("Try: 'premium' or 'upgrade premium'");
      } else if (lowerInput.includes('chat') || lowerInput.includes('message')) {
        suggestions.push("Try: 'chat' or 'my chats'");
      } else if (lowerInput.includes('dashboard')) {
        suggestions.push("Try: 'dashboard' or 'view dashboard'");
      } else if (lowerInput.includes('search') || lowerInput.includes('find') || lowerInput.includes('filter')) {
        suggestions.push("Try: 'search enquiries' or 'filter enquiries'");
      } else {
        suggestions.push("Try: 'how to use' or 'help'");
      }
      
      return {
        answer: contextHint + "I'm here to help! You can ask me about:\n\n• Posting enquiries\n• Responding to enquiries\n• Trust badges\n• Premium features\n• Dashboard\n• Chats\n• Search & filters\n• Settings\n• Any feature!\n\n" + (suggestions.length > 0 ? suggestions[0] + "\n\n" : "") + "What would you like to know?",
        actions: ["View Help Guide", "Go to Dashboard", "Browse Enquiries"],
        navigateTo: "/help-guide"
      };
    } catch (error) {
      console.error('AI response generation failed:', error);
      return getFallbackResponse();
    }
  };

     // SAFETY FALLBACK: Always provide a helpful response
   const getFallbackResponse = () => {
     return {
       answer: "I'm having trouble processing your request right now. You can still use all Enqir features normally. For help, try:\n\n• Browsing enquiries\n• Posting your enquiry\n• Checking the Help Guide\n\nOr ask me something else!",
       actions: ["Browse Enquiries", "Post Enquiry", "View Help Guide"]
     };
   };

  // Handle quick question click
  const handleQuickQuestion = (question: string) => {
    addMessage(question, 'user');
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      const response = generateAIResponse(question.toLowerCase());
      addBotMessage(response.answer, 'text');
      setIsLoading(false);
    }, 1000);
  };

  // Handle quick action click with navigation
  const handleQuickAction = (action: string) => {
    addMessage(`I'll help you with: ${action}`, 'user');
    
    // Map actions to routes
    const actionRoutes: Record<string, string> = {
      "Go to Post Enquiry": "/post-enquiry",
      "Go to Live Enquiries": "/enquiry-wall",
      "Go to Dashboard": "/dashboard",
      "Go to Profile": "/profile",
      "Go to My Chats": "/my-chats",
      "Go to My Enquiries": "/my-enquiries",
      "Go to My Responses": "/my-responses",
      "View Help Guide": "/help-guide",
      "Browse Now": "/enquiry-wall",
      "Browse Enquiries": "/enquiry-wall",
      "View Responses": "/dashboard",
      "View Premium": "/dashboard",
      "Learn More": "/help-guide",
      "Take Tour": "/help-guide"
    };

    const route = actionRoutes[action];
    
    setTimeout(() => {
      if (route) {
        addBotMessage(`I can take you to ${action}. Click the button below to navigate, or use the menu.`, 'text');
        // Don't auto-close - let user decide when to navigate
        // User can click the action button again or use menu
      } else {
        addBotMessage(`Great! I'm here to help with ${action}. You can use the menu or navigation to get there.`, 'text');
      }
    }, 1000);
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    // Add welcome message after clearing
    setTimeout(() => {
      const currentPage = getCurrentPageContext();
      let welcomeMessage = "Chat cleared! I'm your Enqir Assistant. ";
      
      if (currentPage === 'post-enquiry') {
        welcomeMessage += "I see you're posting an enquiry. I can help you with:\n\n• Filling the form\n• Trust badge\n• Premium features\n• Any questions!";
      } else if (currentPage === 'live-enquiries') {
        welcomeMessage += "I see you're browsing enquiries. I can help you with:\n\n• Finding specific enquiries\n• Filtering\n• Responding\n• Trust badges";
      } else if (currentPage === 'dashboard') {
        welcomeMessage += "I see you're on your dashboard. I can help you with:\n\n• Viewing enquiries/responses\n• Premium upgrade\n• Switching views\n• Managing everything";
      } else if (currentPage === 'chats') {
        welcomeMessage += "I see you're in chats. I can help you with:\n\n• Switching between chats\n• Using quick messages\n• Viewing details\n• Closing deals";
      } else {
        welcomeMessage += "I can help you with:\n\n• Posting enquiries\n• Responding to enquiries\n• Trust badges\n• Premium features\n• Dashboard\n• Chats\n• Everything!";
      }
      
      welcomeMessage += "\n\nWhat would you like to know?";
      addBotMessage(welcomeMessage, "text");
    }, 300);
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Clean Minimal Floating Chat Button */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[60]">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <div className="group cursor-pointer relative">
              {/* Subtle Pulse Ring */}
              <div className="absolute inset-0 rounded-full bg-black/20 animate-ping"></div>
              
              {/* Clean FAB Button with Creative Elements */}
              <button className="w-12 h-12 sm:w-14 sm:h-14 bg-white border-2 border-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 group-active:scale-95 flex items-center justify-center relative overflow-hidden">
                <MessageCircle className="h-6 w-6 text-gray-800 group-hover:text-gray-900 transition-colors duration-200 relative z-10" />
                
                {/* Creative Background Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800/10 to-gray-900/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Minimal Status Dot */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                
                {/* Subtle Ripple Effect */}
                <div className="absolute inset-0 rounded-full bg-black/20 scale-0 group-hover:scale-110 transition-transform duration-500"></div>
              </button>
              
              {/* Clean Tooltip */}
              <div className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none">
                <span className="font-medium">Enqir Assistant</span>
                <div className="absolute bottom-0 right-3 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </SheetTrigger>
                 
          <SheetContent 
            side="right" 
            className="w-[86vw] max-w-[380px] sm:w-[480px] h-[85vh] sm:h-[80vh] md:h-[75vh] p-0 bg-white border-l border-gray-200 flex flex-col [&>button]:hidden rounded-2xl sm:rounded-3xl"
            style={{ height: 'calc(100dvh - 2rem)' }}
          >
            {/* Clean Minimal Header */}
            <div className="flex items-center justify-between p-4 border-b border-black bg-black rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-black" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Enqir Assistant</h3>
                  <p className="text-xs text-gray-300 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    {hasError ? 'Limited mode' : 'Online'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4 text-white" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-white border border-gray-200">
                    <DropdownMenuItem
                      onClick={clearChat}
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      Clear Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Close chat"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            {/* Clean Chat Messages - Optimized for better visibility */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0 bg-gray-50/50" style={{ maxHeight: 'calc(100% - 200px)' }}>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div
                    className={`max-w-[85%] sm:max-w-[75%] p-4 sm:p-5 rounded-2xl sm:rounded-3xl transition-all duration-200 hover:shadow-md ${
                      message.sender === 'user'
                        ? 'bg-black text-white rounded-br-md shadow-sm'
                        : 'bg-white text-gray-900 rounded-bl-md border border-gray-200 shadow-sm'
                    }`}
                  >
                    {message.type === 'quick-action' ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleQuickAction(message.text)}
                          className="text-left w-full hover:underline text-sm font-medium flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Sparkles className="h-3 w-3 text-gray-800 group-hover:animate-spin" />
                          <span>{message.text}</span>
                        </button>
                        {message.text.startsWith('Go to ') && (
                          <button
                            onClick={() => {
                              const actionRoutes: Record<string, string> = {
                                "Go to Post Enquiry": "/post-enquiry",
                                "Go to Live Enquiries": "/enquiry-wall",
                                "Go to Dashboard": "/dashboard",
                                "Go to Profile": "/profile",
                                "Go to My Chats": "/my-chats",
                                "Go to My Enquiries": "/my-enquiries",
                                "Go to My Responses": "/my-responses",
                                "View Help Guide": "/help-guide",
                                "Browse Now": "/enquiry-wall",
                                "Browse Enquiries": "/enquiry-wall",
                                "View Responses": "/dashboard",
                                "View Premium": "/dashboard",
                                "Learn More": "/help-guide",
                                "Take Tour": "/help-guide"
                              };
                              const route = actionRoutes[message.text];
                              if (route) {
                                setIsOpen(false);
                                setTimeout(() => navigate(route), 300);
                              }
                            }}
                            className="w-full text-xs px-3 py-1.5 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                          >
                            Navigate Now →
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {message.sender === 'bot' && (
                          <div className="flex items-center gap-2 mb-2.5">
                            <Bot className="h-4 w-4 text-gray-800" />
                            <span className="text-sm font-semibold text-gray-700">Assistant</span>
                          </div>
                        )}
                        <div className={`text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap ${message.sender === 'user' ? 'text-white' : 'text-gray-800'}`}>
                          {message.text.split('\n').map((line, lineIndex) => {
                            // Handle bullet points
                            if (line.trim().startsWith('•')) {
                              return (
                                <div key={lineIndex} className="flex items-start gap-2 mb-1.5">
                                  <span className={`${message.sender === 'user' ? 'text-white' : 'text-gray-800'} mt-1.5 flex-shrink-0`}>•</span>
                                  <span className="flex-1">{line.trim().substring(1).trim()}</span>
                                </div>
                              );
                            }
                            // Handle regular lines
                            return (
                              <p key={lineIndex} className={`${lineIndex === 0 ? 'font-medium mb-2' : 'mb-1.5'} ${message.sender === 'user' ? 'text-white' : 'text-gray-900'}`}>
                                {line || '\u00A0'}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/10">
                      <p className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {message.sender === 'user' && (
                        <User className="h-3 w-3 opacity-70" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Clean Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-white border border-gray-200 p-3 rounded-2xl sm:rounded-3xl rounded-bl-md">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Bot className="h-3 w-3 text-gray-800" />
                        <span className="text-xs font-medium text-gray-600">Assistant</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-500">typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Clean Quick Actions - Compact with full text visible */}
            <div className="p-3 sm:p-4 border-t border-gray-100 bg-white rounded-b-none">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-black rounded-full flex items-center justify-center">
                    <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">Quick Help</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-left p-2.5 sm:p-3 bg-gradient-to-br from-white to-gray-50 hover:from-gray-100 hover:to-gray-200 border-2 border-gray-300 hover:border-black rounded-xl sm:rounded-2xl transition-all duration-300 group disabled:opacity-50 hover:scale-[1.03] active:scale-[0.98] shadow-sm hover:shadow-md relative overflow-hidden"
                      disabled={isLoading}
                    >
                      {/* Background gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="flex items-center gap-1.5 sm:gap-2 relative z-10">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black rounded-full group-hover:bg-gray-900 group-hover:scale-150 transition-all duration-300 flex-shrink-0 shadow-sm"></div>
                        <span className="text-[10px] sm:text-xs font-semibold text-gray-800 group-hover:text-black break-words flex-1 text-left leading-tight">{question}</span>
                        <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:text-black transition-all duration-300 flex-shrink-0 group-hover:rotate-12" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clean Input Area */}
            <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl sm:rounded-b-3xl">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full px-4 py-3 pr-12 text-sm border border-gray-200 rounded-2xl sm:rounded-3xl focus:border-gray-800 focus:ring-2 focus:ring-gray-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                    style={{ fontSize: '16px' }}
                    disabled={isLoading}
                  />
                  {inputText.trim() && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="px-4 py-3 bg-black hover:bg-gray-900 disabled:bg-gray-300 text-white rounded-2xl sm:rounded-3xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default AIChatbot;
