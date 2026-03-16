import '@/i18n';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PanelLayout from "@/layouts/PanelLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Clients from "./pages/Clients";
import Team from "./pages/Team";
import Catalogo from "./pages/Catalogo";
import Unit from "./pages/Unit";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
// ProgressiveSetup removed — merged into Onboarding
import PublicBooking from "./pages/PublicBooking";
import PlanSelection from "./pages/PlanSelection";
import StaffInvite from "./pages/StaffInvite";
import Vendas from "./pages/Vendas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CompanyProvider>
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<Index />} />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Public booking page — no auth required */}
            <Route path="/s/:slug" element={<PublicBooking />} />
            
            {/* Staff invite (no auth required) */}
            <Route path="/invite/:token" element={<StaffInvite />} />

            {/* Plan selection page */}
            <Route path="/plans" element={<PlanSelection />} />

            {/* Onboarding (Phase 1) */}
            <Route path="/onboarding" element={<ProtectedRoute requireSetup={false}><Onboarding /></ProtectedRoute>} />

            {/* Legacy /setup redirects to agenda */}
            <Route path="/setup" element={<Navigate to="/agenda" replace />} />

            {/* Protected panel routes */}
            <Route element={<ProtectedRoute><PanelLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="clients" element={<Clients />} />
              <Route path="team" element={<Team />} />
              <Route path="catalogo" element={<Catalogo />} />
              <Route path="vendas" element={<Vendas />} />
              <Route path="unit" element={<Unit />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </CompanyProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
