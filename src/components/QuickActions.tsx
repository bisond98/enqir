import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, 
  Search, 
  MessageSquare, 
  BookmarkPlus, 
  Share2, 
  Filter,
  Zap,
  TrendingUp,
  Clock,
  Star
} from "lucide-react";
import { Link } from "react-router-dom";

export const QuickActions = () => {
  const actions = [
    {
      icon: Plus,
      label: "Post Enquiry",
      description: "Post a new requirement",
      href: "/post-enquiry",
      color: "text-blue-600"
    },
    {
      icon: Search,
      label: "Browse All",
      description: "Browse all enquiries",
      href: "/enquiries",
      color: "text-green-600"
    },
    {
      icon: MessageSquare,
      label: "Messages",
      description: "View conversations",
      href: "/messages",
      color: "text-purple-600"
    },
    {
      icon: BookmarkPlus,
      label: "Saved",
      description: "View saved enquiries",
      href: "/saved",
      color: "text-orange-600"
    }
  ];
  
  const quickFilters = [
    { label: "Urgent", icon: Clock, color: "text-red-500" },
    { label: "Trending", icon: TrendingUp, color: "text-green-500" },
    { label: "Premium", icon: Star, color: "text-yellow-500" },
    { label: "Near Me", icon: Filter, color: "text-blue-500" }
  ];
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-xl bg-pal-blue hover:bg-pal-blue-dark hover-lift"
          >
            <Zap className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="end" side="top">
          <Card className="border-0 shadow-xl">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-lg">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">Get things done faster</p>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Primary Actions */}
              <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => (
                  <Link key={action.label} to={action.href}>
                    <Button
                      variant="outline"
                      className="h-20 w-full flex flex-col items-center justify-center space-y-2 hover:bg-muted/50 transition-all"
                    >
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                      <div className="text-center">
                        <p className="text-xs font-medium">{action.label}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </Button>
                  </Link>
                ))}
              </div>
              
              {/* Quick Filters */}
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium mb-3">Quick Filters</h4>
                <div className="grid grid-cols-2 gap-2">
                  {quickFilters.map((filter) => (
                    <Button
                      key={filter.label}
                      variant="ghost"
                      size="sm"
                      className="h-10 justify-start"
                    >
                      <filter.icon className={`h-4 w-4 mr-2 ${filter.color}`} />
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Share Action */}
              <div className="border-t border-border pt-4">
                <Button variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share PAL with Friends
                </Button>
              </div>
            </div>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
};