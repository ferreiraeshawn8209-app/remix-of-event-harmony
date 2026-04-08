import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import QuoteDetail from "./pages/QuoteDetail";
import QuoteEdit from "./pages/QuoteEdit";
import ProfileEdit from "./pages/ProfileEdit";
import EventPlanner from "./pages/EventPlanner";
import SongRequest from "./pages/SongRequest";
import DJQueue from "./pages/DJQueue";
import ClientPortal from "./pages/ClientPortal";
import { BackgroundAudio } from "@/components/BackgroundAudio";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BackgroundAudio />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/quote/:id" element={<QuoteDetail />} />
            <Route path="/quote/:id/edit" element={<QuoteEdit />} />
            <Route path="/profile" element={<ProfileEdit />} />
            <Route path="/event-planner/:quoteId" element={<EventPlanner />} />
            <Route path="/request/:eventId" element={<SongRequest />} />
            <Route path="/dj-queue/:eventId" element={<DJQueue />} />
            <Route path="/client" element={<ClientPortal />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
