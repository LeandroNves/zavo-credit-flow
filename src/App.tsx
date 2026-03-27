import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ContractsDataProvider } from "./contexts/ContractsDataContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterSuccess from "./pages/RegisterSuccess";
import RegisterAwaitingApproval from "./pages/RegisterAwaitingApproval";
import NotFound from "./pages/NotFound";

import ClientLayout from "./pages/client/ClientLayout";
import ClientContracts from "./pages/client/ClientContracts";
import ClientContractDetail from "./pages/client/ClientContractDetail";
import ClientPersonalData from "./pages/client/ClientPersonalData";
import ClientProducts from "./pages/client/ClientProducts";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminAuthGuard from "./pages/admin/AdminAuthGuard";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminClients from "./pages/admin/AdminClients";
import AdminCreateCliente from "./pages/admin/AdminCreateCliente";
import AdminClientDetail from "./pages/admin/AdminClientDetail";
import AdminClientData from "./pages/admin/AdminClientData";
import AdminManageContract from "./pages/admin/AdminManageContract";
import AdminCreateContract from "./pages/admin/AdminCreateContract";
import AdminPendingRegistrations from "./pages/admin/AdminPendingRegistrations";
import AdminPendingProductRequests from "./pages/admin/AdminPendingProductRequests";
import AdminReports from "./pages/admin/AdminReports";
import AdminProducts from "./pages/admin/AdminProducts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ContractsDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/cadastro/sucesso" element={<RegisterSuccess />} />
          <Route path="/cadastro/aguardando" element={<RegisterAwaitingApproval />} />

          {/* Client area */}
          <Route path="/cliente" element={<ClientLayout />}>
            <Route index element={<ClientContracts />} />
            <Route path="contrato/:id" element={<ClientContractDetail />} />
            <Route path="produtos" element={<ClientProducts />} />
            <Route path="dados" element={<ClientPersonalData />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminAuthGuard />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminClients />} />
              <Route path="cliente/novo" element={<AdminCreateCliente />} />
              <Route path="cliente/:id" element={<AdminClientDetail />} />
              <Route path="cliente/:id/dados" element={<AdminClientData />} />
              <Route path="cliente/:id/contrato/novo" element={<AdminCreateContract />} />
              <Route path="cliente/:id/contrato/:contratoId" element={<AdminManageContract />} />
              <Route path="pendentes" element={<AdminPendingRegistrations />} />
              <Route path="produtos" element={<AdminProducts />} />
              <Route path="produtos-pendentes" element={<AdminPendingProductRequests />} />
              <Route path="relatorios" element={<AdminReports />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </ContractsDataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
