import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  const location = useLocation();
  
  // Auto-generate breadcrumbs based on route if items not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ];
    
    const routeMap: Record<string, string> = {
      'enquiries': 'Browse Enquiries',
      'post-enquiry': 'Post Enquiry',
      'profile': 'Profile',
      'settings': 'Settings',
      'respond': 'Submit Response'
    };
    
    pathSegments.forEach((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      breadcrumbs.push({
        label,
        href: index === pathSegments.length - 1 ? undefined : path
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbItems = items || generateBreadcrumbs();
  
  if (breadcrumbItems.length <= 1) return null;
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href ? (
            <Link 
              to={item.href} 
              className="hover:text-foreground transition-colors flex items-center space-x-1"
            >
              {index === 0 && <Home className="h-4 w-4" />}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className="text-foreground font-medium flex items-center space-x-1">
              {index === 0 && <Home className="h-4 w-4" />}
              <span>{item.label}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};