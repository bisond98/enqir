import { Mail, Shield, Users, FileText, Building2, Lock, AlertTriangle, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  const footerSections = [
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: Shield,
      link: '/privacy-policy'
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      icon: FileText,
      link: '/terms-and-conditions'
    },
    {
      id: 'refund',
      title: 'Shipping & Refund Policy',
      icon: RotateCcw,
      link: '/refund-policy'
    },
    {
      id: 'contact',
      title: 'Contact Us',
      icon: Mail,
      link: '/contact-us'
    }
  ];

  return (
    <>
      <footer className="bg-background border-t border-border/50 pb-24 sm:pb-0">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-8 lg:gap-12 mb-2 sm:mb-6">
            
            {/* Company Info - Full Width on Mobile, 2 Columns on Desktop */}
            <div className="lg:col-span-2 space-y-2 sm:space-y-6">
              {/* Logo and Company Name */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="space-y-0.5 sm:space-y-1">
                  <h3 className="text-xs sm:text-lg lg:text-xl font-bold text-foreground leading-tight">Enqir<span className="text-[10px] sm:text-xs">.in</span></h3>
                  <p className="text-[9px] sm:text-xs text-muted-foreground max-w-md leading-relaxed">
                    we curate for better deal closings
                  </p>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="flex flex-col items-center text-center p-2 sm:p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all duration-200 group">
                  <div className="w-8 h-8 flex items-center justify-center mb-1">
                    <Shield className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-foreground">ID Verified</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Secure Users</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-center text-center p-2 sm:p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all duration-200 group">
                  <div className="w-8 h-8 flex items-center justify-center mb-1">
                    <Lock className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-foreground">Secure</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Transactions</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-center text-center p-2 sm:p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-all duration-200 group">
                  <div className="w-8 h-8 flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-foreground">Admin</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Oversight</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links - Single Row on Mobile, Grid on Desktop */}
            <div className="lg:col-span-2">
              <h4 className="text-[10px] sm:text-lg font-semibold text-foreground mb-2 sm:mb-6 border-b border-border/50 pb-1 sm:pb-3 text-center sm:text-left">
                Quick Links
              </h4>
              
              {/* Mobile: Single row with text links */}
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 sm:hidden">
                {footerSections.map((section) => (
                  <Link
                    key={section.id}
                    to={section.link}
                    className="text-[10px] text-muted-foreground hover:text-pal-blue transition-colors px-2 py-1 rounded relative after:content-[''] after:absolute after:right-[-6px] after:top-1/2 after:transform after:-translate-y-1/2 after:w-[1px] after:h-3 after:bg-border last:after:hidden"
                  >
                    {section.title}
                  </Link>
                ))}
              </div>
              
              {/* Tablet & Desktop: Grid with icons */}
              <div className="hidden sm:grid grid-cols-2 gap-2 sm:gap-4">
                {footerSections.map((section) => (
                  <Link
                    key={section.id}
                    to={section.link}
                    className="group text-left p-2 sm:p-3 rounded-lg hover:bg-muted/30 transition-all duration-200 border border-transparent hover:border-pal-blue/20"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-pal-blue/10 rounded-md flex items-center justify-center group-hover:bg-pal-blue/20 transition-colors">
                        <section.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pal-blue" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-foreground group-hover:text-pal-blue transition-colors leading-tight">
                        {section.title}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-2 sm:pt-4 border-t border-border/50">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
              {/* Copyright */}
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-sm text-muted-foreground">
                  © www.enqir.in. All Rights Reserved.
                </p>
              </div>
              
              {/* Navigation Links */}
              <div className="flex items-center justify-center sm:justify-end space-x-4 sm:space-x-6">
                <Link to="/" className="text-[10px] sm:text-sm text-muted-foreground hover:text-foreground transition-colors relative after:content-[''] after:absolute after:right-[-12px] after:top-1/2 after:transform after:-translate-y-1/2 after:w-[1px] after:h-3 after:bg-border">
                  Home
                </Link>
                <Link to="/enquiries" className="text-[10px] sm:text-sm text-muted-foreground hover:text-foreground transition-colors relative after:content-[''] after:absolute after:right-[-12px] after:top-1/2 after:transform after:-translate-y-1/2 after:w-[1px] after:h-3 after:bg-border">
                  Browse
                </Link>
                <Link to="/post-enquiry" className="text-[10px] sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Post Enquiry
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
