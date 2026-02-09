import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardLayout from "./layouts/DashboardLayout";
import ParentLayout from "./layouts/ParentLayout";
import InstitutionLayout from "./layouts/InstitutionLayout";
import InstitutionDashboard from "./pages/dashboard/InstitutionDashboard";
import IntroStep from "./pages/dashboard/IntroStep";
import PreImpactStep from "./pages/dashboard/PreImpactStep";
import HollandStep from "./pages/dashboard/HollandStep";
import SimulationStep from "./pages/dashboard/SimulationStep";
import ReportStep from "./pages/dashboard/ReportStep";
import PostImpactStep from "./pages/dashboard/PostImpactStep";
import ProfileStep from "./pages/dashboard/ProfileStep";
import ParentDashboard from "./pages/dashboard/ParentDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<IntroStep />} />
            <Route path="intro" element={<IntroStep />} />
            <Route path="pre-impact" element={<PreImpactStep />} />
            <Route path="holland" element={<HollandStep />} />
            <Route path="simulation" element={<SimulationStep />} />
            <Route path="post-impact" element={<PostImpactStep />} />
            <Route path="report" element={<ReportStep />} />
            <Route path="profile" element={<ProfileStep />} />
          </Route>
          <Route path="/parent" element={<ParentLayout />}>
            <Route index element={<ParentDashboard />} />
          </Route>
          <Route path="/institution" element={<InstitutionLayout />}>
            <Route index element={<InstitutionDashboard />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
