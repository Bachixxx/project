import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ClientAuthProvider } from './contexts/ClientAuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PrivateRoute from './components/PrivateRoute';
import ScrollToTop from './components/ScrollToTop';
import ClientPrivateRoute from './components/client/ClientPrivateRoute';
import ClientLayout from './components/client/ClientLayout';
import Loading from './components/Loading';

// Static Import for Landing Page (Immediate LCP)
import Home from './pages/Home';

// Public Pages (Lazy)
const Marketplace = lazy(() => import('./pages/Marketplace'));
const ProgramDetails = lazy(() => import('./pages/ProgramDetails'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
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

// Coach Private Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Exercises = lazy(() => import('./pages/Exercises'));
const Sessions = lazy(() => import('./pages/Sessions'));
const Programs = lazy(() => import('./pages/Programs'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientDetails = lazy(() => import('./pages/ClientDetails'));
const ClientAnalytics = lazy(() => import('./pages/ClientAnalytics'));
const Calendar = lazy(() => import('./pages/Calendar'));
const LiveWorkout = lazy(() => import('./pages/LiveWorkout'));
const MonthlyRevenue = lazy(() => import('./pages/MonthlyRevenue'));
const Payments = lazy(() => import('./pages/Payments'));
const Profile = lazy(() => import('./pages/Profile'));
const MultiClientCoaching = lazy(() => import('./pages/MultiClientCoaching'));
const Admin = lazy(() => import('./pages/Admin'));

// Client Private Pages
const ClientDashboard = lazy(() => import('./pages/client/ClientDashboard'));
const ClientWorkouts = lazy(() => import('./pages/client/ClientWorkouts'));
const ClientAppointments = lazy(() => import('./pages/client/ClientAppointments'));
const ClientProgress = lazy(() => import('./pages/client/ClientProgress'));
const ClientProfile = lazy(() => import('./pages/client/ClientProfile'));
const ClientWorkout = lazy(() => import('./pages/client/ClientWorkout'));
const ClientLiveWorkout = lazy(() => import('./pages/client/ClientLiveWorkout'));

function App() {
  console.log('🔍 Debug Supabase Config:');
  console.log(' - URL Defined:', !!import.meta.env.VITE_SUPABASE_URL);
  console.log(' - Key Defined:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

  return (
    <AuthProvider>
      <ClientAuthProvider>
        <LanguageProvider>
          <Router>
            <ScrollToTop />
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* Routes publiques */}
                <Route path="/" element={<Home />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/marketplace/program/:id" element={<ProgramDetails />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/upgrade" element={<Upgrade />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/client/login" element={<ClientLogin />} />
                <Route path="/client/check-email" element={<CheckEmail />} />
                <Route path="/client/register" element={<ClientRegister />} />

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
                        <LiveWorkout />
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
                    path="/multi-coaching"
                    element={
                      <PrivateRoute>
                        <MultiClientCoaching />
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
                    path="/client/workout/:clientProgramId"
                    element={
                      <ClientPrivateRoute>
                        <ClientWorkout />
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
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </LanguageProvider>
      </ClientAuthProvider>
    </AuthProvider>
  );
}

export default App;