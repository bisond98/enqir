import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Store, LayoutDashboard } from 'lucide-react';

export default function SellShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="bg-black text-white py-5 sm:py-10 relative overflow-visible">
          <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
            <div className="mb-3 sm:mb-5">
              <div className="flex items-center justify-between">
                <Link to="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-white/10 rounded-xl text-white border border-white/20"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="ml-1">Home</span>
                  </Button>
                </Link>
                <div className="w-10 h-10" />
              </div>
            </div>
            <div className="flex justify-center items-center">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-semibold text-white tracking-tighter text-center inline-flex items-center dashboard-header-no-emoji">
                {title}
              </h1>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
          <div className="hidden sm:flex items-center justify-end gap-2 mb-4">
            <Link to="/sell/marketplace">
              <Button variant="outline" size="sm" className="border border-black">
                <Store className="h-4 w-4 mr-1" />
                Marketplace
              </Button>
            </Link>
            <Link to="/sell/new">
              <Button size="sm" className="bg-black text-white border border-black">
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Button>
            </Link>
            <Link to="/sell/dashboard">
              <Button variant="outline" size="sm" className="border border-black">
                <LayoutDashboard className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            </Link>
          </div>
          <div className="sm:hidden grid grid-cols-3 gap-2 mb-4">
            <Link to="/sell/new">
              <Button size="sm" className="w-full bg-black text-white border border-black">
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Button>
            </Link>
            <Link to="/sell/marketplace">
              <Button variant="outline" size="sm" className="w-full border border-black">
                <Store className="h-4 w-4 mr-1" />
                Shop
              </Button>
            </Link>
            <Link to="/sell/dashboard">
              <Button variant="outline" size="sm" className="w-full border border-black">
                <LayoutDashboard className="h-4 w-4 mr-1" />
                Panel
              </Button>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </Layout>
  );
}


