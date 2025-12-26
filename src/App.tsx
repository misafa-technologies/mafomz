import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Sites from "./pages/Sites";
import CreateSite from "./pages/CreateSite";
import SiteSettings from "./pages/SiteSettings";
import AdminSettings from "./pages/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/sites" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
            <Route path="/sites/create" element={<ProtectedRoute><CreateSite /></ProtectedRoute>} />
            <Route path="/sites/:siteId/settings" element={<ProtectedRoute><SiteSettings /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
            <Route path="/domains" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
            <Route path="/updates" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
            <Route path="/deployments" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
            <Route path="/commissions" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
            <Route path="/editor" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
            <Route path="/bots" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
            <Route path="/signals" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
            <Route path="/theme" element={<ProtectedRoute><Sites /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
