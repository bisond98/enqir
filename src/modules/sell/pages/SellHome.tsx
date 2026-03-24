import { Link } from 'react-router-dom';
import SellShell from '../components/SellShell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Store, LayoutDashboard } from 'lucide-react';

export default function SellHome() {
  return (
    <SellShell title="Sell">
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-black rounded-lg p-4 sm:p-6">
          <p className="text-[9px] sm:text-[11px] text-white text-center font-medium leading-relaxed">
            List what you sell, get discovered, and manage everything in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-[0.5px] border-black rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
            <CardHeader className="font-black text-black text-sm sm:text-base tracking-tight pb-2">Create Listing</CardHeader>
          <CardContent>
              <p className="text-[10px] sm:text-xs text-black mb-3 leading-relaxed">
                Post an item or service with images, tags, and pricing.
              </p>
            <Link to="/sell/new" className="block">
                <Button className="w-full h-12 sm:h-11 bg-black hover:bg-gray-900 text-white border border-black font-black text-xs sm:text-sm rounded-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.1)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3)] active:translate-y-[4px] transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2" />
                Publish Listing
              </Button>
            </Link>
          </CardContent>
        </Card>

          <Card className="border-[0.5px] border-black rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
            <CardHeader className="font-black text-black text-sm sm:text-base tracking-tight pb-2">Marketplace</CardHeader>
          <CardContent>
              <p className="text-[10px] sm:text-xs text-black mb-3 leading-relaxed">
                Browse active listings like a classifieds marketplace.
              </p>
            <Link to="/sell/marketplace" className="block">
                <Button variant="outline" className="w-full h-12 sm:h-11 border border-black font-black text-xs sm:text-sm rounded-xl bg-white hover:bg-gray-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3)] active:translate-y-[4px] transition-all duration-200">
                  <Store className="h-4 w-4 mr-2" />
                Browse Listings
              </Button>
            </Link>
          </CardContent>
        </Card>

          <Card className="border-[0.5px] border-black rounded-xl bg-gradient-to-br from-white to-slate-50/50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] overflow-hidden">
            <CardHeader className="font-black text-black text-sm sm:text-base tracking-tight pb-2">Seller Dashboard</CardHeader>
          <CardContent>
              <p className="text-[10px] sm:text-xs text-black mb-3 leading-relaxed">
                Manage listings and track buyer responses from one dashboard.
              </p>
            <Link to="/sell/dashboard" className="block">
                <Button variant="outline" className="w-full h-12 sm:h-11 border border-black font-black text-xs sm:text-sm rounded-xl bg-white hover:bg-gray-50 shadow-[0_6px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.3)] active:translate-y-[4px] transition-all duration-200">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                Open Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
        </div>
      </div>
    </SellShell>
  );
}


