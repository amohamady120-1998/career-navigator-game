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
import FinalReport from "./pages/dashboard/FinalReport";
import PostImpactStep from "./pages/dashboard/PostImpactStep";
import PostImpactAssessment from "./pages/dashboard/PostImpactAssessment";
import SharedReport from "./pages/share/SharedReport";
import VerifyCertificate from "./pages/share/VerifyCertificate";
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
import CompletionNextStep from "./pages/dashboard/CompletionNextStep";
import ActivateSchoolCode from "./pages/dashboard/ActivateSchoolCode";
import MyProfile from "./pages/dashboard/MyProfile";
import SchoolDashboard from "./pages/dashboard/SchoolDashboard";
import AdminSchools from "./pages/admin/AdminSchools";
import AdminSchoolAdmins from "./pages/admin/AdminSchoolAdmins";
import AdminSchoolOrders from "./pages/admin/AdminSchoolOrders";
import AdminSchoolUsage from "./pages/admin/AdminSchoolUsage";
import AdminSchoolReports from "./pages/admin/AdminSchoolReports";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminErrors from "./pages/admin/AdminErrors";
import AdminHealthCheck from "./pages/admin/AdminHealthCheck";
import { StepGuard } from "./components/StepGuard";
import IntroVideo from "./pages/onboarding/IntroVideo";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { ConsentGate } from "./components/ConsentGate";

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
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/onboarding/intro-video" element={<IntroVideo />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<IntroStep />} />
                <Route path="payment" element={<PaymentStep />} />
                <Route path="intro" element={<IntroStep />} />
                <Route path="orientation" element={<OrientationStep />} />
                <Route path="pre-impact" element={<ConsentGate requiredStep="intro"><StepGuard requiredStep="intro"><PreImpactStep /></StepGuard></ConsentGate>} />
                <Route path="pre-assessment" element={<PreAssessmentIntro />} />
                <Route path="holland" element={<ConsentGate requiredStep="pre-impact"><StepGuard requiredStep="pre-impact"><HollandAssessment /></StepGuard></ConsentGate>} />
                <Route path="initial-report" element={<StepGuard requiredStep="holland"><InitialReportStep /></StepGuard>} />
                <Route path="shortlist" element={<StepGuard requiredStep="initial-report"><ShortlistStep /></StepGuard>} />
                <Route path="excluded-majors" element={<StepGuard requiredStep="shortlist"><ExcludedMajorsStep /></StepGuard>} />
                <Route path="doubt-checkpoint" element={<StepGuard requiredStep="excluded-majors"><DoubtCheckpointStep /></StepGuard>} />
                <Route path="simulation" element={<StepGuard requiredStep="doubt-checkpoint"><SimulationStep /></StepGuard>} />
                <Route path="post-impact" element={<StepGuard requiredStep="simulation"><PostImpactAssessment /></StepGuard>} />
                <Route path="report" element={<StepGuard requiredStep="post-impact"><ReportStep /></StepGuard>} />
                <Route path="final-report" element={<StepGuard requiredStep="post-impact"><FinalReport /></StepGuard>} />
                <Route path="profile" element={<ProfileStep />} />
                <Route path="ai-counselor" element={<AICounselorPage />} />
                <Route path="explore" element={<ExploreMajorDynamic />} />
                <Route path="explore/:majorId" element={<ExploreMajorDatabase />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="certificate" element={<StepGuard requiredStep="report"><Certificate /></StepGuard>} />
                <Route path="consultation" element={<ConsultationBooking />} />
                <Route path="next-step" element={<CompletionNextStep />} />
                <Route path="activate" element={<ActivateSchoolCode />} />
                <Route path="my-profile" element={<MyProfile />} />
                <Route path="school" element={<SchoolDashboard />} />
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
              <Route path="/admin/schools" element={<AdminSchools />} />
              <Route path="/admin/school-orders" element={<AdminSchoolOrders />} />
              <Route path="/admin/school-usage" element={<AdminSchoolUsage />} />
              <Route path="/admin/school-reports" element={<AdminSchoolReports />} />
              <Route path="/admin/school-admins" element={<AdminSchoolAdmins />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/errors" element={<AdminErrors />} />
              <Route path="/admin/health-check" element={<AdminHealthCheck />} />
              <Route path="/admin" element={<SuperAdminDashboard />} />
              <Route path="/share/report/:token" element={<SharedReport />} />
              <Route path="/verify/:code" element={<VerifyCertificate />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
