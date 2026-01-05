import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { GitWarningProvider } from "@/components/GitWarningProvider";

// Eager imports for frequently accessed/small pages
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy imports for large pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SalesAgents = lazy(() => import("./pages/SalesAgents"));
const RoutesPage = lazy(() => import("./pages/Routes"));
const Customers = lazy(() => import("./pages/Customers"));
const Contracts = lazy(() => import("./pages/Contracts"));
const Collection = lazy(() => import("./pages/Collection"));
const Collector = lazy(() => import("./pages/Collector"));
const Reports = lazy(() => import("./pages/Reports"));
const CustomerHistory = lazy(() => import("./pages/CustomerHistory"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const Holidays = lazy(() => import("./pages/Holidays"));

const queryClient = new QueryClient();

// Loading component untuk Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Main App component with Git Warning System
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GitWarningProvider
          threshold={3}
          autoCheck={true}
          checkInterval={45000} // Check setiap 45 detik
          showBanner={true}
          showIndicator={true}
          showToast={false}
          indicatorPosition="top-right"
        >
          <BrowserRouter>
            <div className="min-h-screen bg-gray-50">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="sales-agents" element={<SalesAgents />} />
                    <Route path="routes" element={<RoutesPage />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="contracts" element={<Contracts />} />
                    <Route path="collection" element={<Collection />} />
                    <Route path="collector" element={<Collector />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="customer-history" element={<CustomerHistory />} />
                    <Route path="audit-log" element={<AuditLog />} />
                    <Route path="holidays" element={<Holidays />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Toaster />
              <Sonner />
            </div>
          </BrowserRouter>
        </GitWarningProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;