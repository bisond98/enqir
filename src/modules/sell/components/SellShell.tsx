import Layout from '@/components/Layout';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Store, LayoutDashboard, Tag } from 'lucide-react';

export default function SellShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const path = location.pathname;
  const isCreate = path === '/sell/new';
  const isShop = path === '/sell/marketplace';
  const isPanel = path === '/sell/dashboard';
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="bg-black text-white py-6 sm:py-12 lg:py-16 relative overflow-visible">
          <div className="max-w-5xl mx-auto px-1 sm:px-4 lg:px-8 relative z-10">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <Link to="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-white/10 rounded-xl text-white border border-white/20"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
                <div className="w-10 h-10" />
              </div>
            </div>
            <div className="flex justify-center items-center mb-4 sm:mb-6">
              <h1 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white tracking-tighter text-center drop-shadow-2xl inline-flex items-center gap-2 dashboard-header-no-emoji">
                <Tag className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex-shrink-0" />
                {title}.
              </h1>
            </div>
            <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-white text-center font-medium max-w-2xl mx-auto leading-relaxed">
                  List what you sell, get discovered, and manage everything in one place.
                </p>
              </div>
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
                Sell
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
              <Button size="sm" className={`w-full border-2 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all ${isCreate ? '!bg-none !bg-blue-600 !text-white !border-blue-600 !shadow-lg' : '!bg-none !bg-white !text-black !border-black !shadow-[0_4px_0_0_rgba(0,0,0,0.2)]'}`}>
                <Plus className="h-4 w-4 mr-1" />
                Sell
              </Button>
            </Link>
            <Link to="/sell/marketplace">
              <Button variant="outline" size="sm" className={`w-full border-2 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all ${isShop ? '!bg-none !bg-blue-600 !text-white !border-blue-600 !shadow-lg' : '!bg-none !bg-white !text-black !border-black !shadow-[0_4px_0_0_rgba(0,0,0,0.2)]'}`}>
                <Store className="h-4 w-4 mr-1" />
                Shop
              </Button>
            </Link>
            <Link to="/sell/dashboard">
              <Button variant="outline" size="sm" className={`w-full border-2 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all ${isPanel ? '!bg-none !bg-blue-600 !text-white !border-blue-600 !shadow-lg' : '!bg-none !bg-white !text-black !border-black !shadow-[0_4px_0_0_rgba(0,0,0,0.2)]'}`}>
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


