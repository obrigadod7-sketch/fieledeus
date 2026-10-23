import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/i18n/I18nProvider";
import Index from "./pages/Index";
import Estudo from "./pages/Estudo";
import CultosAoVivo from "./pages/CultosAoVivo";
import Cantina from "./pages/Cantina";
import Ministerios from "./pages/Ministerios";
import MinisterioDetalhe from "./pages/MinisterioDetalhe";
import Missoes from "./pages/Missoes";
import NotFound from "./pages/NotFound";
import KidsPlatform from "./pages/KidsPlatform";
import MinisterioJovens from "./pages/MinisterioJovens";
import Login from "./pages/auth/Login";
import AdminSetup from "./pages/auth/AdminSetup";
import ResetPassword from "./pages/auth/ResetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AuthCallback from "./pages/auth/AuthCallback";
import KidsDashboardLayout from "./pages/kids/KidsDashboardLayout";
import KidsDashboardHome from "./pages/kids/KidsDashboardHome";
import KidsChildrenPage from "./pages/kids/KidsChildrenPage";
import KidsEventsPage from "./pages/kids/KidsEventsPage";
import KidsCheckinsPage from "./pages/kids/KidsCheckinsPage";
import KidsLeadsPage from "./pages/kids/KidsLeadsPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ProtectedTeamRoute } from "./components/auth/ProtectedTeamRoute";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import DashboardAluno from "./pages/dashboard/DashboardAluno";
import ChurchAssistant from "./pages/dashboard/ChurchAssistant";
import DashboardMembers from "./pages/dashboard/DashboardMembers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/estudo" element={<Estudo />} />
            <Route path="/cultos-ao-vivo" element={<CultosAoVivo />} />
            <Route path="/cantina" element={<Cantina />} />
            <Route path="/missoes" element={<Missoes />} />
            <Route path="/ministerios" element={<Ministerios />} />
            <Route path="/ministerios/:slug" element={<MinisterioDetalhe />} />
            <Route path="/ministerio-dos-jovens" element={<MinisterioJovens />} />

            {/* Kids platform */}
            <Route path="/kids" element={<KidsPlatform />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/setup-admin" element={<AdminSetup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Site dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route
                path="assistant"
                element={
                  <ProtectedTeamRoute>
                    <ChurchAssistant />
                  </ProtectedTeamRoute>
                }
              />
              <Route
                path="membros"
                element={
                  <ProtectedTeamRoute>
                    <DashboardMembers />
                  </ProtectedTeamRoute>
                }
              />
              <Route
                path="aluno"
                element={
                  <ProtectedTeamRoute>
                    <DashboardAluno />
                  </ProtectedTeamRoute>
                }
              />
              <Route
                path="kids"
                element={
                  <ProtectedTeamRoute>
                    <KidsDashboardLayout basePath="/dashboard/kids" />
                  </ProtectedTeamRoute>
                }
              >
                <Route index element={<KidsDashboardHome />} />
                <Route path="criancas" element={<KidsChildrenPage />} />
                <Route path="eventos" element={<KidsEventsPage />} />
                <Route path="checkin" element={<KidsCheckinsPage />} />
                <Route path="leads" element={<KidsLeadsPage />} />
              </Route>
            </Route>
            <Route
              path="/kids/dashboard"
              element={
                <ProtectedRoute>
                  <KidsDashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<KidsDashboardHome />} />
              <Route path="criancas" element={<KidsChildrenPage />} />
              <Route path="eventos" element={<KidsEventsPage />} />
              <Route path="checkin" element={<KidsCheckinsPage />} />
              <Route path="leads" element={<KidsLeadsPage />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
