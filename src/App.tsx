import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/MainLayout";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Cases from "./pages/Cases";
import Documents from "./pages/Documents";
import Templates from "./pages/Templates";
import CalendarPage from "./pages/CalendarPage";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><MainLayout><Index /></MainLayout></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute><MainLayout><Clients /></MainLayout></ProtectedRoute>} />
              <Route path="/cases" element={<ProtectedRoute><MainLayout><Cases /></MainLayout></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><MainLayout><Documents /></MainLayout></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><MainLayout><Templates /></MainLayout></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><MainLayout><CalendarPage /></MainLayout></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute><MainLayout><Invoices /></MainLayout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
