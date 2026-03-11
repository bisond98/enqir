import { Link } from 'react-router-dom';
import SellShell from '../components/SellShell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Store, LayoutDashboard } from 'lucide-react';

export default function SellHome() {
  return (
    <SellShell title="Sell">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)]">
          <CardHeader className="font-black text-black">Create Listing</CardHeader>
          <CardContent>
            <p className="text-xs text-gray-700 mb-3">Post an item/service for sale with images, tags, and pricing.</p>
            <Link to="/sell/new" className="block">
              <Button className="w-full bg-black text-white border border-black font-black">
                <Plus className="h-4 w-4 mr-2" />
                Publish Listing
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)]">
          <CardHeader className="font-black text-black">Marketplace</CardHeader>
          <CardContent>
            <p className="text-xs text-gray-700 mb-3">Browse listings like a classifieds marketplace.</p>
            <Link to="/sell/marketplace" className="block">
              <Button variant="outline" className="w-full border border-black font-black">
                <Store className="h-4 w-4 mr-2" />
                Browse Listings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)]">
          <CardHeader className="font-black text-black">Seller Dashboard</CardHeader>
          <CardContent>
            <p className="text-xs text-gray-700 mb-3">Manage your listings and view buyer responses.</p>
            <Link to="/sell/dashboard" className="block">
              <Button variant="outline" className="w-full border border-black font-black">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Open Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </SellShell>
  );
}


