import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { ContractsDataProvider } from "./contexts/ContractsDataContext";
import { RequireAdminAuth } from "./components/admin/RequireAdminAuth";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";
import RegisterSuccess from "./pages/RegisterSuccess";
import NotFound from "./pages/NotFound";

import ClientLayout from "./pages/client/ClientLayout";
import ClientContracts from "./pages/client/ClientContracts";
import ClientContractDetail from "./pages/client/ClientContractDetail";
import ClientPersonalData from "./pages/client/ClientPersonalData";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminClients from "./pages/admin/AdminClients";
import AdminClientDetail from "./pages/admin/AdminClientDetail";
import AdminClientData from "./pages/admin/AdminClientData";
import AdminManageContract from "./pages/admin/AdminManageContract";
import AdminCreateContract from "./pages/admin/AdminCreateContract";
import AdminPendingRegistrations from "./pages/admin/AdminPendingRegistrations";
import AdminReports from "./pages/admin/AdminReports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AdminAuthProvider>
      <ContractsDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/cadastro/sucesso" element={<RegisterSuccess />} />

          {/* Client area */}
          <Route path="/cliente" element={<ClientLayout />}>
            <Route index element={<ClientContracts />} />
            <Route path="contrato/:id" element={<ClientContractDetail />} />
            <Route path="dados" element={<ClientPersonalData />} />
          </Route>

          {/* Admin area — exige sessão após /admin/login */}
          <Route
            path="/admin"
            element={
              <RequireAdminAuth>
                <AdminLayout />
              </RequireAdminAuth>
            }
          >
            <Route index element={<AdminClients />} />
            <Route path="cliente/:id" element={<AdminClientDetail />} />
            <Route path="cliente/:id/dados" element={<AdminClientData />} />
            <Route path="cliente/:id/contrato/novo" element={<AdminCreateContract />} />
            <Route path="cliente/:id/contrato/:contratoId" element={<AdminManageContract />} />
            <Route path="pendentes" element={<AdminPendingRegistrations />} />
            <Route path="relatorios" element={<AdminReports />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </ContractsDataProvider>
      </AdminAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
