import React, { useState, Suspense } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Dumbbell, Calendar, TrendingUp,
  User, LogOut, Menu, X, Activity
} from 'lucide-react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ClientBottomNav from './ClientBottomNav';
import PageTransition from '../PageTransition';
import { DashboardSkeleton } from './skeletons/DashboardSkeleton';

function ClientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { client, signOut } = useClientAuth();
  const { branding } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      navigate('/client/login');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Pages that have their own immersive hero header and don't need the default top nav
  const immersivePages = ['/client/dashboard', '/client/workouts', '/client/profile', '/client/body-composition'];
  const isImmersivePage = immersivePages.includes(location.pathname) ||
    location.pathname.startsWith('/client/workouts/') || // For detailed views if they become immersive
    location.pathname.includes('?tab='); // Handle query params if needed, though pathname usually excludes them

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100">
      {/* Top Navigation Bar - Hidden on Immersive Pages */}
      {!isImmersivePage && (
        <nav className="bg-white/10 backdrop-blur-lg shadow-xl fixed w-full z-50 pt-[env(safe-area-inset-top)]">
          <div className="max-w-9xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-lg text-white hover:bg-white/10 lg:hidden hidden" // Hidden on mobile now
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
                <div className="ml-2 lg:ml-0 flex items-center gap-3">
                  <img src={branding?.logoUrl || "/logo.png"} alt="Coachency" className="h-8 w-8 rounded-lg shadow-lg" />
                  <span className="text-xl font-bold text-white bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                    {branding?.appName || 'Coachency Client'}
                    {client && (
                      <span className="hidden md:inline-block text-sm font-normal ml-2 text-white/70">
                        • {client.full_name}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Marketplace Link Hidden
                <Link
                  to="/marketplace"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors"
                  title="Marketplace"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="font-medium">Marketplace</span>
                </Link>
                <Link
                  to="/marketplace"
                  className="sm:hidden p-2 rounded-full hover:bg-white/10 text-amber-300"
                  title="Marketplace"
                >
                  <ShoppingBag className="w-5 h-5" />
                </Link>
                */}
                <Link
                  to="/client/profile"
                  className="p-2 rounded-full hover:bg-white/10 text-white"
                  title="Mon profil"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-full hover:bg-white/10 text-white"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <div className={`flex w-full pb-20 lg:pb-0 ${isImmersivePage ? 'pt-0' : 'pt-[calc(4rem+env(safe-area-inset-top))]'}`}>
        {/* Mobile Sidebar */}
        <div
          className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Sidebar */}
        <aside
          className={`fixed lg:static w-64 xl:w-72 h-[calc(100vh-4rem)] bg-white/10 backdrop-blur-lg z-40 transform transition-transform duration-300 lg:transform-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <nav className="h-full overflow-y-auto py-8 px-4">
            <div className="space-y-2">
              <NavLink
                to="/client/dashboard"
                icon={<LayoutDashboard className="w-5 h-5" />}
                text="Tableau de bord"
                active={isActive('/client/dashboard')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink
                to="/client/workouts"
                icon={<Dumbbell className="w-5 h-5" />}
                text="Mes entraînements"
                active={isActive('/client/workouts')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink
                to="/client/appointments"
                icon={<Calendar className="w-5 h-5" />}
                text="Rendez-vous"
                active={isActive('/client/appointments')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink
                to="/client/progress"
                icon={<TrendingUp className="w-5 h-5" />}
                text="Mes progrès"
                active={isActive('/client/progress')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink
                to="/client/body-composition"
                icon={<Activity className="w-5 h-5" />}
                text="Biométrie"
                active={isActive('/client/body-composition')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </nav>
        </aside>

        {/* Mobile Bottom Navigation */}
        <ClientBottomNav />

        {/* Main Content */}
        <main className="flex-1 w-full p-0 lg:p-8 overflow-x-hidden">
          <React.Fragment key={location.pathname}> {/* Force re-render for animation */}
            {/* Note: AnimatePresence needs to be handled at a higher level or around specific routes for exit animations to work perfectly with Outlet, 
                 but wrapping the content here gives us the enter animation which is the most important for "feel". 
                 For full exit animations with Router, we usually need useLocation key on Routes. 
                 Since we are inside Layout, we can use a key'd wrapper. */}
            <PageTransition>
              <Suspense fallback={<DashboardSkeleton />}>
                <Outlet />
              </Suspense>
            </PageTransition>
          </React.Fragment>
        </main>
      </div>
    </div>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  active: boolean;
  className?: string;
  onClick: () => void;
}

function NavLink({ to, icon, text, active, className = '', onClick }: NavLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center px-4 py-3 text-white rounded-lg hover:bg-white/10 transition-colors ${active ? 'bg-white/20' : ''
        } ${className}`}
    >
      {icon}
      <span className="ml-3 text-base xl:text-lg">{text}</span>
    </Link>
  );
}

export default ClientLayout;