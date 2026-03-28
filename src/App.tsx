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
import CoachPrivateRoute from './components/coach/CoachPrivateRoute';
import ScrollToTop from './components/ScrollToTop';
import ClientPrivateRoute from './components/client/ClientPrivateRoute';
import ClientLayout from './components/client/ClientLayout';
import Loading from './components/Loading';
import PublicHome from './components/PublicHome';
import { AdaptyProvider } from './contexts/AdaptyContext';

// Static Import for Landing Page (Immediate LCP)
import Home from './pages/Home';
import CityLandingPage from './pages/CityLandingPage';

// Public Pages (Lazy)
// const Marketplace = lazy(() => import('./pages/Marketplace'));
// const ProgramDetails = lazy(() => import('./pages/ProgramDetails'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register')); // Keep if we want to revert later, but unused for main route
const CoachOnboarding = lazy(() => import('./pages/coach/CoachOnboarding'));
const Waitlist = lazy(() => import('./pages/Waitlist')); // New
const Features = lazy(() => import('./pages/Features'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Legal = lazy(() => import('./pages/Legal'));
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancelled from './pages/PaymentCancelled';

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
                              <Route path="/onboarding" element={<CoachPrivateRoute><CoachOnboarding /></CoachPrivateRoute>} />
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
                              <Route path="/payment-success" element={<PaymentSuccess />} />
                              <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                              <Route path="/geneve" element={<CityLandingPage cityName="Genève" urlPath="geneve" />} />
                              <Route path="/lausanne" element={<CityLandingPage cityName="Lausanne" urlPath="lausanne" />} />
                              <Route path="/zurich" element={<CityLandingPage cityName="Zurich" urlPath="zurich" />} />
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
                                    <CoachPrivateRoute>
                                      <Admin />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/dashboard"
                                  element={
                                    <CoachPrivateRoute>
                                      <Dashboard />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/profile"
                                  element={
                                    <CoachPrivateRoute>
                                      <Profile />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/exercises"
                                  element={
                                    <CoachPrivateRoute>
                                      <Exercises />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/sessions"
                                  element={
                                    <CoachPrivateRoute>
                                      <Sessions />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/blocks"
                                  element={
                                    <CoachPrivateRoute>
                                      <Blocks />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/programs"
                                  element={
                                    <CoachPrivateRoute>
                                      <Programs />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/clients"
                                  element={
                                    <CoachPrivateRoute>
                                      <Clients />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/clients/:clientId"
                                  element={
                                    <CoachPrivateRoute>
                                      <ClientDetails />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/clients/:clientId/analytics"
                                  element={
                                    <CoachPrivateRoute>
                                      <ClientAnalytics />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/calendar"
                                  element={
                                    <CoachPrivateRoute>
                                      <Calendar />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/workout/:clientProgramId"
                                  element={
                                    <CoachPrivateRoute>
                                      <CoachProgramDetails />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/monthly-revenue"
                                  element={
                                    <CoachPrivateRoute>
                                      <MonthlyRevenue />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/payments"
                                  element={
                                    <CoachPrivateRoute>
                                      <Payments />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/terminal"
                                  element={
                                    <CoachPrivateRoute>
                                      <Terminal />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/offers"
                                  element={
                                    <CoachPrivateRoute>
                                      <Offers />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/multi-coaching"
                                  element={
                                    <CoachPrivateRoute>
                                      <MultiClientCoaching />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/branding"
                                  element={
                                    <CoachPrivateRoute>
                                      <BrandingSettings />
                                    </CoachPrivateRoute>
                                  }
                                />
                                <Route
                                  path="/live-session/:sessionId"
                                  element={
                                    <CoachPrivateRoute>
                                      <LiveSessionMode />
                                    </CoachPrivateRoute>
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