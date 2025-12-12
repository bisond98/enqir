import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Store, 
  Crown, 
  Shield, 
  MessageSquare, 
  LayoutDashboard, 
  Filter,
  CheckCircle,
  ArrowRight,
  X,
  Search,
  Bot
} from "lucide-react";

const HelpGuide = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    {
      id: "ai",
      title: "AI Assistant",
      icon: Bot,
      content: [
        {
          title: "How AI Helps You",
          description: "Our AI automatically finds the best matches, suggests relevant enquiries, and helps you connect faster.",
          steps: [
            "Smart search finds exactly what you need",
            "AI suggests best sellers for your enquiry",
            "Auto-approves quality responses instantly",
            "Filters spam and fake accounts automatically"
          ]
        },
        {
          title: "For Buyers",
          description: "AI shows you the most relevant sellers, verifies their quality, and helps you make better decisions.",
          steps: [
            "See top-rated sellers first",
            "Get quality-verified responses",
            "Smart recommendations based on your needs"
          ]
        },
        {
          title: "For Sellers",
          description: "AI helps your responses get approved faster, matches you with right buyers, and boosts your visibility.",
          steps: [
            "Fast auto-approval for quality responses",
            "Better matching with relevant enquiries",
            "Priority placement for verified sellers"
          ]
        }
      ]
    },
    {
      id: "buyers",
      title: "For Buyers",
      icon: ShoppingCart,
      content: [
        {
          title: "Post What You Need",
          description: "Tell us what you're looking for. Add your budget and location.",
          steps: [
            "Click 'Post Enquiry'",
            "Describe what you need",
            "Set budget and location",
            "Upload ID (optional, for trust badge)",
            "Submit - AI will help match you with sellers"
          ]
        },
        {
          title: "Get Responses",
          description: "Sellers will respond with offers. AI helps show you the best ones first.",
          steps: [
            "Go to 'My Enquiries'",
            "See all seller responses",
            "Check prices and images",
            "Click to chat with sellers"
          ]
        },
        {
          title: "Chat & Close Deal",
          description: "Talk to sellers, ask questions, and finalize your purchase.",
          steps: [
            "Open chat from seller response",
            "Use quick buttons for common questions",
            "Share images or make calls",
            "Agree and close the deal"
          ]
        }
      ]
    },
    {
      id: "sellers",
      title: "For Sellers",
      icon: Store,
      content: [
        {
          title: "Find Opportunities",
          description: "Browse enquiries that match what you sell. AI helps show you the most relevant ones.",
          steps: [
            "Go to 'Live Enquiries'",
            "Search or filter by category",
            "Click to see enquiry details",
            "Check budget and requirements"
          ]
        },
        {
          title: "Send Your Offer",
          description: "Respond with your price, description, and images. AI helps get you approved faster.",
          steps: [
            "Click 'Respond' on enquiry",
            "Add price and description",
            "Upload product images",
            "Upload ID (for trust badge)",
            "Submit - AI auto-approves quality responses"
          ]
        },
        {
          title: "Chat & Sell",
          description: "Buyers will chat with you. Answer questions and close deals.",
          steps: [
            "Buyer starts chat after approval",
            "Use quick buttons for fast replies",
            "Share more details or images",
            "Finalize and complete the sale"
          ]
        }
      ]
    },
    {
      id: "premium",
      title: "Premium",
      icon: Crown,
      content: [
        {
          title: "What You Get",
          description: "Get more visibility and faster results with premium.",
          steps: [
            "Show at top of search results",
            "More views and responses",
            "Priority placement",
            "Premium badge on your profile"
          ]
        },
        {
          title: "How to Upgrade",
          description: "Upgrade from your dashboard in seconds.",
          steps: [
            "Go to Dashboard",
            "Click Premium",
            "Choose plan and pay",
            "Get instant benefits"
          ]
        }
      ]
    },
    {
      id: "trustbadge",
      title: "Trust Badge",
      icon: Shield,
      content: [
        {
          title: "What It Is",
          description: "A blue checkmark that shows you're verified and trusted.",
          steps: [
            "Blue checkmark on your profile",
            "Shows you're verified",
            "Builds trust with others",
            "More responses and better matches"
          ]
        },
        {
          title: "How to Get It",
          description: "Two ways to get trust badge - Profile KYC (for all) or Form upload (for specific enquiry).",
          steps: [
            "Profile KYC: Go to Profile, upload ID (front & back), enter ID number, submit - approved in 24-48 hours",
            "If you add trust badge through KYC in profile, all your enquiries (as buyer) and responses (as seller) automatically get trust badge",
            "You can remove the trust badge from profile anytime you want",
            "Form upload: Trust badges from buyers and sellers forms are only for that particular enquiry"
          ]
        }
      ]
    },
    {
      id: "chat",
      title: "Chat",
      icon: MessageSquare,
      content: [
        {
          title: "How It Works",
          description: "Chat automatically opens when seller response is approved.",
          steps: [
            "Buyer clicks approved response to chat",
            "Send messages, images, or make calls",
            "Use quick buttons for common questions",
            "Agree on terms and close deal"
          ]
        },
        {
          title: "Quick Messages",
          description: "Fast buttons for payment, delivery, quality, meetup questions.",
          steps: [
            "Click quick message buttons",
            "Instant pre-written messages",
            "Saves time on common questions"
          ]
        },
        {
          title: "My Chats",
          description: "See all your conversations in one place.",
          steps: [
            "Go to 'My Chats'",
            "View all conversations",
            "See unread message counts"
          ]
        }
      ]
    },
    {
      id: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      content: [
        {
          title: "Your Control Center",
          description: "See everything in one place - enquiries, responses, chats, and stats.",
          steps: [
            "View all your enquiries and responses",
            "Track chats and messages",
            "Manage premium and settings",
            "See notifications and updates"
          ]
        }
      ]
    },
    {
      id: "filtering",
      title: "Search & Filter",
      icon: Filter,
      content: [
        {
          title: "Smart Search",
          description: "AI-powered search finds exactly what you need.",
          steps: [
            "Type in search bar",
            "AI matches title, description, category",
            "See instant results",
            "Click to view details"
          ]
        },
        {
          title: "Trust Badge Filter",
          description: "Show only verified users for extra safety.",
          steps: [
            "Go to 'Live Enquiries'",
            "Click filter icon (left of grid/list)",
            "Select 'Trust badge only'",
            "See only verified users"
          ]
        },
        {
          title: "Other Filters",
          description: "Filter by category or switch between grid/list view.",
          steps: [
            "Use category dropdown to filter",
            "Toggle grid/list view",
            "Find what works best for you"
          ]
        }
      ]
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header - Matching Dashboard Style - Full Width */}
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16">
          <div className="mb-4 sm:mb-6 flex justify-end px-4 sm:px-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="p-2 sm:p-2 hover:bg-white/10 rounded-xl transition-colors relative z-50"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </Button>
          </div>
          
          {/* Heading in Black Header */}
          <div className="flex flex-col justify-center items-center mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white tracking-tighter text-center drop-shadow-2xl inline-flex items-center gap-2 mb-2 sm:mb-3">
              <Bot className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex-shrink-0" />
              How to Use Enqir
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-300 text-center px-4">
              Simple guide with AI-powered features to help you succeed
            </p>
          </div>
        </div>

        {/* Enqir Assistant Notice */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-[0.5px] border-blue-800 shadow-[0_4px_0_0_rgba(0,0,0,0.3)] rounded-xl px-3 sm:px-6 py-2 sm:py-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-center gap-1.5 sm:gap-3 whitespace-nowrap overflow-hidden">
              <Bot className="h-3 w-3 sm:h-5 sm:w-5 text-white flex-shrink-0" />
              <p className="text-[10px] sm:text-sm font-semibold text-white text-center truncate">
                Got more doubts? Enqir assistant here 24/7 to help!
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

          {/* Quick Overview - For Buyers */}
          <Card className="group border-[0.5px] border-black bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] rounded-2xl mb-6 sm:mb-8 overflow-hidden hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
            <CardHeader className="bg-black text-white rounded-t-2xl relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white">
                  <ShoppingCart className="h-5 w-5 text-black" />
                </div>
                <CardTitle className="text-base sm:text-lg font-black text-white">
                  For Buyers - How It Works
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 relative z-10">
              <div className="space-y-4">
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    1
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Post Your Enquiry</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Go to "Post Enquiry", fill in what you need, your budget, and location.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    2
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Choose Premium (Optional)</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Get more than 2 responses from different sellers with different offers. Select what's better for you.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    3
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Add Trust Badge (Optional)</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Complete KYC in your profile - all your enquiries get trust badge automatically. You can remove it anytime. Or complete KYC in enquiry form for that enquiry only.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    4
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">AI Verifies Instantly</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Our AI verifies your enquiry and matches you with the right sellers automatically.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    5
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Track from Dashboard</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Track all your enquiries from the dashboard.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    6
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Chat & Close Deal</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Chat with sellers for your needs and close the deal.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Overview - For Sellers */}
          <Card className="group border-[0.5px] border-black bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] rounded-2xl mb-6 sm:mb-8 overflow-hidden hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-2xl" />
            <CardHeader className="bg-black text-white rounded-t-2xl relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white">
                  <Store className="h-5 w-5 text-black" />
                </div>
                <CardTitle className="text-base sm:text-lg font-black text-white">
                  For Sellers - How It Works
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 relative z-10">
              <div className="space-y-4">
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    1
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Browse Live Enquiries</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Go to "Live Enquiries" and find enquiries that match what you sell.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    2
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Send Your Offer</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Click "Respond" on any enquiry, add your price, description, and upload product images.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    3
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Add Trust Badge (Optional)</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Complete KYC in your profile - all your responses get trust badge automatically. You can remove it anytime. Or complete KYC in response form for that response only.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    4
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">AI Auto-Approves</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Our AI instantly approves quality responses, so buyers see your offer faster.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    5
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Get Chatted</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Buyers will chat with you about their needs. Answer questions and share details.</p>
                  </div>
                </div>
                <div className="group/step flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/50 border-[0.5px] border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-black text-sm shadow-[0_2px_0_0_rgba(0,0,0,0.3)]">
                    6
                  </div>
                  <div className="flex-1 relative z-10">
                    <p className="text-sm sm:text-base font-black text-black mb-2">Close the Sale</p>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">Finalize terms with buyers and complete the sale.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(activeSection === section.id ? null : section.id);
                    setTimeout(() => {
                      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                  className={`group relative p-4 rounded-xl border-[0.5px] border-black bg-white transition-all duration-200 text-left overflow-hidden ${
                    activeSection === section.id
                      ? 'shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] scale-105'
                      : 'shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-95 active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)]'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none rounded-xl" />
                  <Icon className="h-6 w-6 mb-2 text-black relative z-10" />
                  <p className="text-xs sm:text-sm font-black text-black relative z-10">
                    {section.title}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Sections */}
          <div className="space-y-6 sm:space-y-8">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.id}
                  id={section.id}
                  className="border-[0.5px] border-black bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] rounded-2xl overflow-hidden hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] transition-all duration-300"
                >
                  <CardHeader className="bg-black text-white pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-white">
                        <Icon className="h-6 w-6 text-black" />
                      </div>
                      <CardTitle className="text-base sm:text-lg font-black text-white">
                        {section.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-6">
                    {section.content.map((item, index) => (
                      <div key={index} className="border-l-4 border-black pl-4 sm:pl-6">
                        <h3 className="text-lg sm:text-xl font-black text-black mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-700 mb-4">
                          {item.description}
                        </p>
                        <div className="space-y-2">
                          {item.steps.map((step, stepIndex) => (
                            <div key={stepIndex} className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-700 flex-1">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer CTA */}
          <div className="mt-8 sm:mt-12">
            <Card className="border-[0.5px] border-black bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] rounded-2xl overflow-hidden">
              <CardHeader className="bg-black text-white rounded-t-2xl">
                <CardTitle className="text-base sm:text-lg font-black text-white text-center">
                  Ready to Get Started?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-gray-700 mb-6">
                  Join thousands of users buying and selling on Enqir
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate('/post-enquiry')}
                    className="bg-black text-white hover:bg-gray-800 border-[0.5px] border-black shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] active:scale-95 transition-all duration-200"
                  >
                    Post an Enquiry
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    onClick={() => navigate('/enquiries')}
                    variant="outline"
                    className="border-[0.5px] border-black bg-white text-black hover:bg-gray-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] hover:shadow-[0_4px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(0,0,0,0.2)] active:scale-95 transition-all duration-200"
                  >
                    Browse Enquiries
                    <Search className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HelpGuide;
