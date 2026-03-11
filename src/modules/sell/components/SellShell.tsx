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
      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="border border-black">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Home
              </Button>
            </Link>
            <h1 className="text-lg sm:text-2xl font-black text-black">{title}</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2">
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
        </div>
        {children}
      </div>
    </Layout>
  );
}


