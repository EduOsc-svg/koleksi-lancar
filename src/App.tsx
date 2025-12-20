import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import SalesAgents from "./pages/SalesAgents";
import RoutesPage from "./pages/Routes";
import Customers from "./pages/Customers";
import Contracts from "./pages/Contracts";
import Collection from "./pages/Collection";
import Reports from "./pages/Reports";
import CustomerHistory from "./pages/CustomerHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sales-agents" element={<SalesAgents />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/history" element={<CustomerHistory />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
