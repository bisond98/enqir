import Layout from '@/components/Layout';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Store, LayoutDashboard, Tag } from 'lucide-react';
import { SellTagDoodle } from '@/components/doodles';
import SellHeaderPoster from '@/components/sellHeaderPoster';
import HeaderPoster from '@/components/headerPoster';

export default function SellShell({
  title,
  children,
  filterOpen,
  onToggleFilter,
  onBack,
  hidePanel,
  compactHeader,
  hideQuickNav,
  headerTitle,
  headerSubtitle,
  headerProgress,
  headerBadge,
  pageBackground,
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
  /** New listing wizard only: the step name shown in the hero, styled and
   *  sized exactly like the Post Enquiry header lockup. */
  headerTitle?: React.ReactNode;
  /** New listing wizard only: the one-line description under the step name. */
  headerSubtitle?: string;
  /** New listing wizard only: step progress, 0-100, on the bar under the lockup. */
  headerProgress?: number;
  /** New listing wizard only: the picked category, shown in the header's
   *  top-right corner so it stays visible on every tab. */
  headerBadge?: React.ReactNode;
  /** Page canvas override, so a wizard tab can use the grey canvas the Post
   *  Enquiry wizard uses. Omitted keeps the default soft gradient. */
  pageBackground?: string;
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
      <div className={`min-h-screen ${pageBackground ?? 'bg-gradient-to-br from-slate-50 via-white to-slate-50'}`}>
        <div className={`bg-black text-white ${compactHeader ? 'py-4 min-h-[116px] sm:min-h-[124px]' : 'py-6 sm:py-12 lg:py-16'} relative overflow-visible`}>
          {/* Seller poster covering the whole black header behind the text —
              a wide print sliced to fill, so every header size crops into a
              composed poster. Absolutely positioned, so the header keeps
              exactly its height; the scrim keeps the heading first. */}
          {isCreate && (
            <div aria-hidden="true" className="pointer-events-none select-none absolute inset-0 overflow-hidden">
              {/* The poster stays as texture but is dimmed hard behind the
                  lockup, so the step name and its line read at full contrast. */}
              <SellHeaderPoster className="absolute inset-0 h-full w-full opacity-80" />
              <div className="absolute inset-0 bg-black/55" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/90" />
            </div>
          )}
          {/* The marketplace band wears a photographic trust poster behind the
              heading. It is absolutely positioned, so the header keeps its height. */}
          {isShop && (
            <div aria-hidden="true" className="pointer-events-none select-none absolute inset-0 overflow-hidden">
              <HeaderPoster
                word="SHOP"
                chip="SAFE DEALS"
                caption="VERIFIED SELLERS"
                tagLabel="FAIR PRICE"
                className="absolute inset-0 h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-black/55" />
            </div>
          )}
          {compactHeader && (
            <div className="absolute inset-0 flex items-center justify-center px-16 pointer-events-none">
              {heading}
            </div>
          )}
          {/* New listing wizard: the same hero lockup as Post Enquiry — left
              aligned step name, one line of reassurance, step bar under it — so
              both forms share one header size. */}
          {isCreate && headerTitle ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (onBack) {
                    onBack();
                    return;
                  }
                  navigate(-1);
                }}
                className="absolute left-2 top-2 sm:left-4 sm:top-4 p-2 hover:bg-white/10 rounded-xl transition-colors z-50"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </Button>
              {/* Keeps the size the category chip had inside the card: same 10px
                  black-weight uppercase type, just sitting in the header. */}
              {headerBadge && (
                <div className="absolute right-2 top-2 sm:right-4 sm:top-4 z-50 inline-flex max-w-[52%] items-center truncate rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] sm:text-[11px] font-black uppercase leading-tight tracking-wide text-white backdrop-blur-sm">
                  {headerBadge}
                </div>
              )}
              <div className="max-w-4xl mx-auto px-4 sm:px-4 lg:px-8 relative z-10 flex w-full items-center justify-center min-h-[117px] sm:min-h-[44px]">
                <div className="relative w-full max-w-[340px] min-w-0 flex-1 text-left">
                  <h1 className="text-[clamp(20px,5.6vw,23px)] font-bold leading-[1.15] tracking-[-0.02em] text-white dashboard-header-no-emoji min-w-0">
                    {headerTitle}
                  </h1>
                  {headerSubtitle && (
                    <p className="mt-1.5 whitespace-nowrap text-[8.5px] sm:text-[11px] font-normal leading-4 tracking-[-0.01em] text-white/65">
                      {headerSubtitle}
                    </p>
                  )}
                  <div className="absolute inset-x-0 top-full mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.max(0, Math.min(100, headerProgress ?? 0))}%`,
                        backgroundColor: '#15803d'
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
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
          )}
        </div>
        <div className={isCreate ? "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 sm:-mt-6 pb-6 sm:pb-8 lg:pb-10" : "max-w-5xl mx-auto px-2.5 sm:px-4 py-4 sm:py-6"}>
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


