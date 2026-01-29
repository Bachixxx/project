import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Dumbbell,
  Users,
  Calendar,
  LogOut,
  User,
  Crown,
  DollarSign,
  Menu,
  X,
  Globe,
  ChevronDown,
  ChevronRight,
  Layers,
  UsersRound,
  Shield,
  Palette,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { useLanguage } from '../contexts/LanguageContext';
import { t, languages, Language } from '../i18n';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { subscriptionInfo } = useSubscription();
  const { language, setLanguage } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isWorkoutMenuOpen, setIsWorkoutMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      try {
        const { supabase } = await import('../lib/supabase');
        const { data } = await supabase
          .from('coaches')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();

        setIsAdmin(data?.is_admin || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;
  const isActiveParent = (paths: string[]) => paths.some(path => location.pathname.startsWith(path));

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsLanguageMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-black/40 backdrop-blur-xl border-b border-white/5 shadow-xl fixed w-full z-50">
        <div className="max-w-[2560px] mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-white hover:bg-white/10 lg:hidden"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
              <div className="ml-2 lg:ml-0 flex items-center gap-2">
                <img src="/app-logo.jpg" alt="Coachency" className="h-8 w-8 rounded-lg" />
                <span className="text-xl font-bold text-white">Coachency</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                  className="p-2 rounded-full hover:bg-white/10 text-white flex items-center gap-2"
                  title="Changer de langue"
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-sm hidden sm:inline">{languages[language]}</span>
                </button>
                {isLanguageMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                    {Object.entries(languages).map(([code, name]) => (
                      <button
                        key={code}
                        onClick={() => handleLanguageChange(code as Language)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${language === code ? 'bg-gray-50 text-blue-600 font-medium' : 'text-gray-700'
                          }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Link
                to="/profile"
                className="p-2 rounded-full hover:bg-white/10 text-white"
                title="Profile"
              >
                <User className="w-5 h-5" />
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-full hover:bg-white/10 text-white"
                title={t('auth.logout', language)}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-full pt-16">
        {/* Mobile Sidebar Overlay */}
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 w-64 h-[calc(100vh-4rem)] bg-black/40 backdrop-blur-xl border-r border-white/5 z-40 transform transition-transform duration-300 lg:transform-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
        >
          <nav className="h-full overflow-y-auto py-8 px-4">
            <div className="space-y-2">
              <NavLink
                to="/dashboard"
                icon={<LayoutDashboard className="w-5 h-5" />}
                text={t('nav.dashboard', language)}
                active={isActive('/dashboard')}
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Workout Menu (Replaces Exercises and Programs) */}
              <div className="relative">
                <button
                  onClick={() => setIsWorkoutMenuOpen(!isWorkoutMenuOpen)}
                  className={`flex items-center w-full px-4 py-3 text-white rounded-lg hover:bg-white/10 transition-colors ${isActiveParent(['/exercises', '/programs', '/sessions']) ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30' : ''
                    }`}
                >
                  <Dumbbell className="w-5 h-5 mr-3" />
                  <span className="text-base xl:text-lg flex-1">Entraînements</span>
                  {isWorkoutMenuOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {isWorkoutMenuOpen && (
                  <div className="pl-4 mt-1 space-y-1">
                    <NavLink
                      to="/exercises"
                      icon={<Dumbbell className="w-4 h-4" />}
                      text="Exercices"
                      active={isActive('/exercises')}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-2"
                    />
                    <NavLink
                      to="/sessions"
                      icon={<Layers className="w-4 h-4" />}
                      text="Séances"
                      active={isActive('/sessions')}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-2"
                    />
                    <NavLink
                      to="/programs"
                      icon={<Layers className="w-4 h-4" />}
                      text="Programmes"
                      active={isActive('/programs')}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-2"
                    />
                  </div>
                )}
              </div>

              <NavLink
                to="/clients"
                icon={<Users className="w-5 h-5" />}
                text={t('nav.clients', language)}
                active={isActive('/clients')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink
                to="/calendar"
                icon={<Calendar className="w-5 h-5" />}
                text={t('nav.calendar', language)}
                active={isActive('/calendar')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink
                to="/multi-coaching"
                icon={<UsersRound className="w-5 h-5" />}
                text="Multi-Coaching"
                active={isActive('/multi-coaching')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink
                to="/payments"
                icon={<DollarSign className="w-5 h-5" />}
                text="Paiements"
                active={isActive('/payments')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink
                to="/terminal"
                icon={<Smartphone className="w-5 h-5" />}
                text="Terminal"
                active={isActive('/terminal')}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink
                to="/branding"
                icon={<Palette className="w-5 h-5" />}
                text="Mon Image de Marque"
                active={isActive('/branding')}
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {isAdmin && (
                <NavLink
                  to="/admin"
                  icon={<Shield className="w-5 h-5" />}
                  text="Administration"
                  active={isActive('/admin')}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 border border-red-500/30"
                />
              )}
            </div>

            {subscriptionInfo?.type === 'free' && (
              <div className="mt-8">
                <NavLink
                  to="/upgrade"
                  icon={<Crown className="w-5 h-5" />}
                  text="Passer à Pro"
                  active={isActive('/upgrade')}
                  className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="flex-1">
            <div className="max-w-[2560px] mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavLink({ to, icon, text, active, className = '', onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center px-4 py-3 text-white rounded-lg hover:bg-white/10 transition-colors ${active ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30' : ''
        } ${className}`}
    >
      {icon}
      <span className="ml-3 text-base xl:text-lg">{text}</span>
    </Link>
  );
}

export default Layout;