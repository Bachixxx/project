import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ClientAuthProvider } from './contexts/ClientAuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
// NotificationsProvider moved here to be accessible by ClientAuthProvider
import { NotificationsProvider } from './contexts/NotificationsContext';
import { LiveSessionProvider } from './contexts/LiveSessionContext'; // Added
import { TerminalProvider } from './contexts/TerminalContext'; // Added
import PrivateRoute from './components/PrivateRoute';
import ScrollToTop from './components/ScrollToTop';
import ClientPrivateRoute from './components/client/ClientPrivateRoute';
import ClientLayout from './components/client/ClientLayout';
import Loading from './components/Loading';
import PublicHome from './components/PublicHome';
import { AdaptyProvider } from './contexts/AdaptyContext';

// Static Import for Landing Page (Immediate LCP)
import Home from './pages/Home';

// Public Pages (Lazy)
// const Marketplace = lazy(() => import('./pages/Marketplace'));
// const ProgramDetails = lazy(() => import('./pages/ProgramDetails'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register')); // Keep if we want to revert later, but unused for main route
const Waitlist = lazy(() => import('./pages/Waitlist')); // New
const Features = lazy(() => import('./pages/Features'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Legal = lazy(() => import('./pages/Legal'));

// Client Public Pages
const ClientLogin = lazy(() => import('./pages/client/ClientLogin'));
const CheckEmail = lazy(() => import('./pages/client/CheckEmail'));
const ClientRegister = lazy(() => import('./pages/client/ClientRegister'));
const ClientOnboarding = lazy(() => import('./pages/client/ClientOnboarding'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));

// Coach Private Pages (Eagerly Loaded for Native Feel)
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Calendar from './pages/Calendar';
import Sessions from './pages/Sessions';
import Programs from './pages/Programs';
import Profile from './pages/Profile';

// Less critical / Heavy pages can remain lazy to save some initial bundle
const Exercises = lazy(() => import('./pages/Exercises'));
const Blocks = lazy(() => import('./pages/Blocks'));
const ClientDetails = lazy(() => import('./pages/ClientDetails'));
const ClientAnalytics = lazy(() => import('./pages/ClientAnalytics'));
const CoachProgramDetails = lazy(() => import('./pages/CoachProgramDetails'));
const LiveWorkout = lazy(() => import('./pages/LiveWorkout'));
const MonthlyRevenue = lazy(() => import('./pages/MonthlyRevenue'));
const Payments = lazy(() => import('./pages/Payments'));
const Terminal = lazy(() => import('./pages/Terminal'));
const Offers = lazy(() => import('./pages/Offers'));
const MultiClientCoaching = lazy(() => import('./pages/MultiClientCoaching'));
const Admin = lazy(() => import('./pages/Admin'));
const BrandingSettings = lazy(() => import('./pages/BrandingSettings'));


// Client Private Pages (Eagerly Loaded)
import ClientDashboard from './pages/client/ClientDashboard';
import ClientWorkouts from './pages/client/ClientWorkouts';
import ClientAppointments from './pages/client/ClientAppointments';
import ClientProgress from './pages/client/ClientProgress';

// Less critical client pages
const ClientProfile = lazy(() => import('./pages/client/ClientProfile'));
const ClientBodyComposition = lazy(() => import('./pages/client/ClientBodyComposition'));
const ClientWorkout = lazy(() => import('./pages/client/ClientWorkout'));
const ClientLiveWorkout = lazy(() => import('./pages/client/ClientLiveWorkout'));
const LiveSessionMode = lazy(() => import('./pages/LiveSessionMode')); // Added

// Mobile Redirection Component
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

const NativeRedirect = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Logic for redirect
      if (location.pathname === '/') {
        navigate('/login');
      }

      // Hide Splash Screen once the app is mounted and routing is determined
      // We add a tiny delay to ensure the first paint has happened
      const hideSplash = async () => {
        await SplashScreen.hide();
      };

      hideSplash();
    }
  }, [location, navigate]);

  return <>{children}</>;
};

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';

function App() {
  console.log('🔍 Debug Supabase Config:');
  console.log(' - URL Defined:', !!import.meta.env.VITE_SUPABASE_URL);
  console.log(' - Key Defined:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdaptyProvider>
          <NotificationsProvider>
            <ClientAuthProvider>
              <LanguageProvider>
                <ThemeProvider>
                  <LiveSessionProvider>
                    <TerminalProvider>
                      <Router>
                        <ScrollToTop />
                        <Suspense fallback={<Loading />}>
                          <NativeRedirect>
                            <Routes>
                              {/* Routes publiques */}
                              <Route path="/" element={<PublicHome />} />
                              {/* <Route path="/marketplace" element={<Marketplace />} /> */}
                              <Route path="/features" element={<Features />} />
                              <Route path="/pricing" element={<Pricing />} />
                              {/* <Route path="/marketplace/program/:id" element={<ProgramDetails />} /> */}

                              <Route path="/login" element={<Login />} />
                              <Route path="/register" element={<Register />} />
                              <Route path="/waitlist" element={<Waitlist />} />
                              <Route path="/upgrade" element={<Upgrade />} />
                              <Route path="/terms" element={<Terms />} />
                              <Route path="/privacy" element={<Privacy />} />
                              <Route path="/legal" element={<Legal />} />
                              <Route path="/client/login" element={<ClientLogin />} />
                              <Route path="/client/check-email" element={<CheckEmail />} />
                              <Route path="/client/register" element={<ClientRegister />} />
                              <Route path="/forgot-password" element={<ForgotPassword />} />
                              <Route path="/update-password" element={<UpdatePassword />} />

                              {/* Routes coach */}
                              <Route element={<Layout />}>
                                <Route
                                  path="/admin"
                                  element={
                                    <PrivateRoute>
                                      <Admin />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/dashboard"
                                  element={
                                    <PrivateRoute>
                                      <Dashboard />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/profile"
                                  element={
                                    <PrivateRoute>
                                      <Profile />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/exercises"
                                  element={
                                    <PrivateRoute>
                                      <Exercises />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/sessions"
                                  element={
                                    <PrivateRoute>
                                      <Sessions />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/blocks"
                                  element={
                                    <PrivateRoute>
                                      <Blocks />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/programs"
                                  element={
                                    <PrivateRoute>
                                      <Programs />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/clients"
                                  element={
                                    <PrivateRoute>
                                      <Clients />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/clients/:clientId"
                                  element={
                                    <PrivateRoute>
                                      <ClientDetails />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/clients/:clientId/analytics"
                                  element={
                                    <PrivateRoute>
                                      <ClientAnalytics />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/calendar"
                                  element={
                                    <PrivateRoute>
                                      <Calendar />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/workout/:clientProgramId"
                                  element={
                                    <PrivateRoute>
                                      <CoachProgramDetails />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/monthly-revenue"
                                  element={
                                    <PrivateRoute>
                                      <MonthlyRevenue />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/payments"
                                  element={
                                    <PrivateRoute>
                                      <Payments />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/terminal"
                                  element={
                                    <PrivateRoute>
                                      <Terminal />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/offers"
                                  element={
                                    <PrivateRoute>
                                      <Offers />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/multi-coaching"
                                  element={
                                    <PrivateRoute>
                                      <MultiClientCoaching />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/branding"
                                  element={
                                    <PrivateRoute>
                                      <BrandingSettings />
                                    </PrivateRoute>
                                  }
                                />
                                <Route
                                  path="/live-session/:sessionId"
                                  element={
                                    <PrivateRoute>
                                      <LiveSessionMode />
                                    </PrivateRoute>
                                  }
                                />
                              </Route>

                              {/* Routes client */}
                              <Route element={<ClientLayout />}>
                                <Route
                                  path="/client/dashboard"
                                  element={
                                    <ClientPrivateRoute>
                                      <ClientDashboard />
                                    </ClientPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/client/workouts"
                                  element={
                                    <ClientPrivateRoute>
                                      <ClientWorkouts />
                                    </ClientPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/client/appointments"
                                  element={
                                    <ClientPrivateRoute>
                                      <ClientAppointments />
                                    </ClientPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/client/progress"
                                  element={
                                    <ClientPrivateRoute>
                                      <ClientProgress />
                                    </ClientPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/client/profile"
                                  element={
                                    <ClientPrivateRoute>
                                      <ClientProfile />
                                    </ClientPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/client/body-composition"
                                  element={
                                    <ClientPrivateRoute>
                                      <ClientBodyComposition />
                                    </ClientPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/client/onboarding"
                                  element={
                                    <ClientPrivateRoute>
                                      <ClientOnboarding />
                                    </ClientPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/client/workout/:clientProgramId"
                                  element={
                                    <ClientPrivateRoute>
                                      <ClientWorkout />
                                    </ClientPrivateRoute>
                                  }
                                />
                              </Route>

                              {/* Client Live Workout Routes (Standalone) */}
                              <Route
                                path="/client/live-workout/appointment/:appointmentId"
                                element={
                                  <ClientPrivateRoute>
                                    <ClientLiveWorkout />
                                  </ClientPrivateRoute>
                                }
                              />
                              <Route
                                path="/client/live-workout/:scheduledSessionId"
                                element={
                                  <ClientPrivateRoute>
                                    <ClientLiveWorkout />
                                  </ClientPrivateRoute>
                                }
                              />
                            </Routes>
                          </NativeRedirect>
                        </Suspense>
                      </Router>
                    </TerminalProvider>
                  </LiveSessionProvider>
                </ThemeProvider>
              </LanguageProvider>
            </ClientAuthProvider>
          </NotificationsProvider>
        </AdaptyProvider>
      </AuthProvider >
    </QueryClientProvider>
  );
}

export default App;