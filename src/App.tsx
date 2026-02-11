import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardLayout from "./layouts/DashboardLayout";
import ParentLayout from "./layouts/ParentLayout";
import InstitutionLayout from "./layouts/InstitutionLayout";
import InstitutionDashboard from "./pages/dashboard/InstitutionDashboard";
import IntroStep from "./pages/dashboard/IntroStep";
import OrientationStep from "./pages/dashboard/OrientationStep";
import PreImpactStep from "./pages/dashboard/PreImpactStep";
import HollandAssessment from "./pages/dashboard/HollandAssessment";
import PreAssessmentIntro from "./pages/dashboard/PreAssessmentIntro";
import SimulationStep from "./pages/dashboard/SimulationStep";
import ReportStep from "./pages/dashboard/ReportStep";
import PostImpactStep from "./pages/dashboard/PostImpactStep";
import ProfileStep from "./pages/dashboard/ProfileStep";
import SettingsPage from "./pages/dashboard/Settings";
import Certificate from "./pages/dashboard/Certificate";
import PaymentStep from "./pages/dashboard/PaymentStep";
import AICounselorPage from "./pages/dashboard/AICounselorPage";
import ShortlistStep from "./pages/dashboard/ShortlistStep";
import InitialReportStep from "./pages/dashboard/InitialReportStep";
import ExcludedMajorsStep from "./pages/dashboard/ExcludedMajorsStep";
import DoubtCheckpointStep from "./pages/dashboard/DoubtCheckpointStep";
import ExploreMajorDatabase from "./pages/dashboard/ExploreMajorDatabase";
import AdminExploreManager from "./pages/admin/AdminExploreManager";
import ExploreMajorDynamic from "./pages/dashboard/ExploreMajorDynamic";
import ParentDashboard from "./pages/dashboard/ParentDashboard";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import ConsultationBooking from "./pages/dashboard/ConsultationBooking";
import AdminConsultations from "./pages/admin/AdminConsultations";
import { StepGuard } from "./components/StepGuard";
import IntroVideo from "./pages/onboarding/IntroVideo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding/intro-video" element={<IntroVideo />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<IntroStep />} />
                <Route path="payment" element={<PaymentStep />} />
                <Route path="intro" element={<IntroStep />} />
                <Route path="orientation" element={<OrientationStep />} />
                <Route path="pre-impact" element={<StepGuard requiredStep="intro"><PreImpactStep /></StepGuard>} />
                <Route path="pre-assessment" element={<PreAssessmentIntro />} />
                <Route path="holland" element={<StepGuard requiredStep="pre-impact"><HollandAssessment /></StepGuard>} />
                <Route path="initial-report" element={<StepGuard requiredStep="holland"><InitialReportStep /></StepGuard>} />
                <Route path="shortlist" element={<StepGuard requiredStep="initial-report"><ShortlistStep /></StepGuard>} />
                <Route path="excluded-majors" element={<StepGuard requiredStep="shortlist"><ExcludedMajorsStep /></StepGuard>} />
                <Route path="doubt-checkpoint" element={<StepGuard requiredStep="excluded-majors"><DoubtCheckpointStep /></StepGuard>} />
                <Route path="simulation" element={<StepGuard requiredStep="doubt-checkpoint"><SimulationStep /></StepGuard>} />
                <Route path="post-impact" element={<StepGuard requiredStep="simulation"><PostImpactStep /></StepGuard>} />
                <Route path="report" element={<StepGuard requiredStep="post-impact"><ReportStep /></StepGuard>} />
                <Route path="profile" element={<ProfileStep />} />
                <Route path="ai-counselor" element={<AICounselorPage />} />
                <Route path="explore" element={<ExploreMajorDynamic />} />
                <Route path="explore/:majorId" element={<ExploreMajorDatabase />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="certificate" element={<StepGuard requiredStep="report"><Certificate /></StepGuard>} />
                <Route path="consultation" element={<ConsultationBooking />} />
              </Route>
              <Route path="/parent" element={<ParentLayout />}>
                <Route index element={<ParentDashboard />} />
                <Route path="ai-counselor" element={<AICounselorPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="/institution" element={<InstitutionLayout />}>
                <Route index element={<InstitutionDashboard />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="/admin/explore-manager" element={<AdminExploreManager />} />
              <Route path="/admin/consultations" element={<AdminConsultations />} />
              <Route path="/admin" element={<SuperAdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
