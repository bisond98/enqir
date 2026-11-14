import Layout from '@/components/Layout';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Store, LayoutDashboard, Tag } from 'lucide-react';
import { SellTagDoodle } from '@/components/doodles';
import { SellHeaderDoodles } from '@/components/sellHeaderDoodles';
import { EnquiryTrustDoodles } from '@/components/enquiryTrustDoodles';

export default function SellShell({
  title,
  children,
  filterOpen,
  onToggleFilter,
  onBack,
  hidePanel,
  compactHeader,
  hideQuickNav,
}: {
  title: string;
  children: React.ReactNode;
  /** Marketplace only: whether the filter panel is open + how to toggle it. */
  filterOpen?: boolean;
  onToggleFilter?: () => void;
  /** Optional override for the header back button (e.g. wizard step-back). */
  onBack?: () => void;
  /** Listing detail only: the Panel route already lives in the page's ⋯ menu,
   *  so the mobile tile row drops to two columns and skips the Panel tile. */
  hidePanel?: boolean;
  /** Listing detail: match the enquiry page's compact black header — same
   *  width, no intro card, and no trailing gap after the title. */
  compactHeader?: boolean;
  /** Listing detail: drop the quick-action rows (Marketplace/Sell/Dashboard
   *  on desktop, Sell/Shop/Panel on mobile) that sit under the header. */
  hideQuickNav?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const isCreate = path === '/sell/new';
  const isShop = path === '/sell/marketplace';
  const isPanel = path === '/sell/dashboard';
  // Listing detail centres the title inside the black band; every other sell
  // page keeps it as a row under the back button.
  const heading = (
    <h1 className={`text-lg sm:text-2xl lg:text-3xl ${compactHeader ? '' : 'xl:text-4xl'} font-black text-white tracking-tighter text-center drop-shadow-2xl inline-flex items-center gap-2 dashboard-header-no-emoji`}>
      <Tag className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex-shrink-0 text-blue-400" />
      <span className="bg-gradient-to-r from-white via-white to-blue-300 bg-clip-text text-transparent">{title}.</span>
      {isCreate && (
        <SellTagDoodle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex-shrink-0 text-white/25" />
      )}
    </h1>
  );
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className={`bg-black text-white ${compactHeader ? 'py-4 min-h-[116px] sm:min-h-[124px]' : 'py-6 sm:py-12 lg:py-16'} relative overflow-visible`}>
          {/* Selling mural filling the whole black header behind the text —
              the enquiry form's treatment, drawn for a seller. Absolutely
              positioned, so the header keeps exactly its height. */}
          {isCreate && (
            <div aria-hidden="true" className="pointer-events-none select-none absolute inset-0 overflow-hidden text-white/20">
              <SellHeaderDoodles className="absolute inset-0 h-full w-full" />
            </div>
          )}
          {/* The marketplace band gets the same trust doodle field the enquiries
              header uses — safe selling, fair payment, filled edge to edge. */}
          {isShop && (
            <div aria-hidden="true" className="pointer-events-none select-none absolute inset-0 overflow-hidden text-white/20">
              <EnquiryTrustDoodles className="absolute inset-0 h-full w-full" />
            </div>
          )}
          {compactHeader && (
            <div className="absolute inset-0 flex items-center justify-center px-16 pointer-events-none">
              {heading}
            </div>
          )}
          <div className={`${compactHeader ? 'max-w-4xl px-4' : 'max-w-5xl px-1 sm:px-4 lg:px-8'} mx-auto relative z-10`}>
            <div className={compactHeader ? 'mb-3' : 'mb-4 sm:mb-6'}>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Wizard pages can supply their own back behavior
                    // (e.g. step-back through form tabs).
                    if (onBack) {
                      onBack();
                      return;
                    }
                    if (path.startsWith('/sell/listing/')) {
                      // Prefer the exact page the user navigated from (passed via router state)
                      const from = (location.state as any)?.from;
                      if (from) {
                        navigate(from);
                      } else if ((window.history.state as any)?.idx > 0) {
                        navigate(-1);
                      } else {
                        navigate('/sell/marketplace');
                      }
                    }
                    else if (path === '/sell/dashboard') {
                      // Opening the Panel from a listing's ⋯ menu passes that
                      // listing in router state, so back returns there. Every
                      // other route into the dashboard keeps going home.
                      const from = (location.state as any)?.from;
                      if (from) navigate(from);
                      else navigate('/');
                    }
                    else if (path === '/sell/marketplace') navigate('/');
                    else navigate(-1);
                  }}
                  className="p-2 hover:bg-white/10 rounded-xl text-white border border-white/20"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <div className="w-10 h-10" />
              </div>
            </div>
            {!compactHeader && (
              <div className="flex justify-center items-center mb-4 sm:mb-6">
                {heading}
              </div>
            )}
            {!compactHeader && (
              <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8">
                <div className="text-center">
                  <p className="text-[8px] sm:text-[9px] lg:text-[10px] text-white text-center font-medium max-w-2xl mx-auto leading-relaxed">
                    List what you sell, get discovered, and manage everything in one place.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-2.5 sm:px-4 py-4 sm:py-6">
          {!hideQuickNav && <div className="hidden sm:flex items-center justify-end gap-2 mb-4">
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
          </div>}
          {/* The new-listing form keeps its mobile screen clean: the Sell / Shop /
              Panel tile row is dropped there only — the desktop row is untouched. */}
          {!hideQuickNav && !isShop && !isCreate && (
          <div className={`sm:hidden grid ${hidePanel ? 'grid-cols-2' : 'grid-cols-3'} gap-3 mb-4`}>
            <Link to="/sell/new">
              <Button size="sm" variant="outline" className={`w-full h-[50px] font-black !text-[15px] !rounded-2xl !border-[1.5px] !border-black relative overflow-hidden group transition-all !duration-150 active:!translate-y-[2px] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.5),0_2px_3px_rgba(0,0,0,0.10)] ${isCreate ? '!bg-blue-600 hover:!bg-blue-700 !text-white !shadow-[0_2px_0_0_rgba(0,0,0,0.5),0_4px_6px_rgba(0,0,0,0.12)]' : '!bg-white hover:!bg-gray-50 !text-black !shadow-[0_2px_0_0_rgba(0,0,0,0.5),0_4px_6px_rgba(0,0,0,0.12)]'}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                <Plus className="h-4 w-4 mr-1 relative z-10" />
                <span className="relative z-10">Sell</span>
              </Button>
            </Link>
            <Link to="/sell/marketplace">
              <Button variant="outline" size="sm" className={`w-full h-[50px] font-black !text-[15px] !rounded-2xl !border-[1.5px] !border-black relative overflow-hidden group transition-all !duration-150 active:!translate-y-[2px] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.5),0_2px_3px_rgba(0,0,0,0.10)] ${isShop ? '!bg-blue-600 hover:!bg-blue-700 !text-white !shadow-[0_2px_0_0_rgba(0,0,0,0.5),0_4px_6px_rgba(0,0,0,0.12)]' : '!bg-white hover:!bg-gray-50 !text-black !shadow-[0_2px_0_0_rgba(0,0,0,0.5),0_4px_6px_rgba(0,0,0,0.12)]'}`}>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                <Store className="h-4 w-4 mr-1 relative z-10" />
                <span className="relative z-10">Shop</span>
              </Button>
            </Link>
            {isShop ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFilter}
                className={`w-full h-[50px] font-black !text-[15px] !rounded-2xl !border-[1.5px] !border-black relative overflow-hidden group transition-all !duration-150 active:!translate-y-[2px] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.5),0_2px_3px_rgba(0,0,0,0.10)] ${filterOpen ? '!bg-blue-600 hover:!bg-blue-700 !text-white !shadow-[0_2px_0_0_rgba(0,0,0,0.5),0_4px_6px_rgba(0,0,0,0.12)]' : '!bg-white hover:!bg-gray-50 !text-black !shadow-[0_2px_0_0_rgba(0,0,0,0.5),0_4px_6px_rgba(0,0,0,0.12)]'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                <LayoutDashboard className="h-4 w-4 mr-1 relative z-10" />
                <span className="relative z-10">Filter</span>
              </Button>
            ) : !hidePanel ? (
              <Link to="/sell/dashboard">
                <Button variant="outline" size="sm" className={`w-full h-[50px] font-black !text-[15px] !rounded-2xl !border-[1.5px] !border-black relative overflow-hidden group transition-all !duration-150 active:!translate-y-[2px] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.5),0_2px_3px_rgba(0,0,0,0.10)] ${isPanel ? '!bg-blue-600 hover:!bg-blue-700 !text-white !shadow-[0_2px_0_0_rgba(0,0,0,0.5),0_4px_6px_rgba(0,0,0,0.12)]' : '!bg-white hover:!bg-gray-50 !text-black !shadow-[0_2px_0_0_rgba(0,0,0,0.5),0_4px_6px_rgba(0,0,0,0.12)]'}`}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
                  <LayoutDashboard className="h-4 w-4 mr-1 relative z-10" />
                  <span className="relative z-10">Panel</span>
                </Button>
              </Link>
            ) : null}
          </div>
          )}
          {children}
        </div>
      </div>
    </Layout>
  );
}


