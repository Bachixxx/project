import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import ProgramDetails from './pages/ProgramDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import Exercises from './pages/Exercises';
import Sessions from './pages/Sessions';
import Programs from './pages/Programs';
import Clients from './pages/Clients';
import ClientDetails from './pages/ClientDetails';
import Calendar from './pages/Calendar';
import LiveWorkout from './pages/LiveWorkout';
import MonthlyRevenue from './pages/MonthlyRevenue';
import Payments from './pages/Payments';
import Upgrade from './pages/Upgrade';
import Profile from './pages/Profile';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Legal from './pages/Legal';
import Layout from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { ClientAuthProvider } from './contexts/ClientAuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PrivateRoute from './components/PrivateRoute';
import ScrollToTop from './components/ScrollToTop';
import ClientPrivateRoute from './components/client/ClientPrivateRoute';
import ClientLayout from './components/client/ClientLayout';
import ClientLogin from './pages/client/ClientLogin';
import CheckEmail from './pages/client/CheckEmail';
import ClientRegister from './pages/client/ClientRegister';
import ClientDashboard from './pages/client/ClientDashboard';
import ClientWorkouts from './pages/client/ClientWorkouts';
import ClientAppointments from './pages/client/ClientAppointments';
import ClientProgress from './pages/client/ClientProgress';
import ClientMessages from './pages/client/ClientMessages';
import ClientProfile from './pages/client/ClientProfile';
import ClientWorkout from './pages/client/ClientWorkout';
import ClientLiveWorkout from './pages/client/ClientLiveWorkout';
import ClientAnalytics from './pages/ClientAnalytics';
import MultiClientCoaching from './pages/MultiClientCoaching';
import Admin from './pages/Admin';

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
          </Router>
        </LanguageProvider>
      </ClientAuthProvider>
    </AuthProvider>
  );
}

export default App;