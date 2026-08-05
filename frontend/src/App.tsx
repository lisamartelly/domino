import { useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AuthPage } from "./components/AuthPage";
import { LandingPage } from "./components/LandingPage";
import { AboutPage } from "./components/AboutPage";
import { MatchmakingPage } from "./components/MatchmakingPage";
import { ContactPage } from "./components/ContactPage";
import { IntakePage } from "./components/IntakePage";
import { Dashboard } from "./components/Dashboard";
import { MatchSection } from "./components/matching/MatchSection";
import { MatchViewPage } from "./components/matching/MatchViewPage";
import { ActivityIdeasPage } from "./components/ActivityIdeasPage";
import { NewsletterSubscribersPage } from "./components/NewsletterSubscribersPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MatchFlowProvider } from "./contexts/MatchFlowContext";
import { AppLayout } from "./components/layout/AppLayout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { EventsPage } from "./components/events/EventsPage";
import { EventDetailPage } from "./components/events/EventDetailPage";
import { EventManagePage } from "./components/events/EventManagePage";
import { PaymentSuccessPage } from "./components/events/PaymentSuccessPage";
import { PaymentCancelPage } from "./components/events/PaymentCancelPage";
import { resolveAfterIntakeComplete } from "./utils/returnUrl";

function PostAuthRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const returnUrl = params.get("returnUrl");
  const safe = returnUrl ? decodeURIComponent(returnUrl) : null;
  const to =
    safe && safe.startsWith("/") && !safe.startsWith("//") ? safe : "/dashboard";
  return <Navigate to={to} replace />;
}

const PUBLIC_PATHS = ["/", "/login", "/events", "/about", "/matchmaking", "/contact"];

function AppRoutes() {
  const { isAuthenticated, hasCompletedIntake, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const authAfterLoad = useRef<boolean | null>(null);

  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      hasCompletedIntake &&
      location.pathname === "/intake"
    ) {
      navigate(resolveAfterIntakeComplete(location.search), { replace: true });
    }
  }, [
    isAuthenticated,
    hasCompletedIntake,
    isLoading,
    location.pathname,
    location.search,
    navigate,
  ]);

  useEffect(() => {
    if (isLoading) return;

    const wasAuthenticated = authAfterLoad.current;
    const isPublicPath =
      PUBLIC_PATHS.includes(location.pathname) ||
      location.pathname.startsWith("/events/") &&
        !location.pathname.startsWith("/events/manage");
    if (
      wasAuthenticated === true &&
      !isAuthenticated &&
      !isPublicPath
    ) {
      navigate("/", { replace: true });
    }
    authAfterLoad.current = isAuthenticated;
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center">
        <div className="text-cream-50 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* ── Public pages ── */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <PostAuthRedirect />
          ) : (
            <PublicLayout flush>
              <LandingPage />
            </PublicLayout>
          )
        }
      />
      <Route
        path="/about"
        element={
          <PublicLayout>
            <AboutPage />
          </PublicLayout>
        }
      />
      <Route
        path="/matchmaking"
        element={
          <PublicLayout>
            <MatchmakingPage />
          </PublicLayout>
        }
      />
      <Route
        path="/contact"
        element={
          <PublicLayout>
            <ContactPage />
          </PublicLayout>
        }
      />
      <Route
        path="/events"
        element={
          <PublicLayout>
            <EventsPage />
          </PublicLayout>
        }
      />
      <Route
        path="/events/:id"
        element={
          <PublicLayout>
            <EventDetailPage />
          </PublicLayout>
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <PostAuthRedirect /> : <AuthPage />
        }
      />

      {/* ── Protected pages ── */}
      <Route
        path="/intake"
        element={
          <ProtectedRoute>
            <IntakePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/match/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MatchFlowProvider>
                <MatchSection />
              </MatchFlowProvider>
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/m/:publicId"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MatchViewPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity-ideas"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ActivityIdeasPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/newsletter"
        element={
          <ProtectedRoute>
            <AppLayout>
              <NewsletterSubscribersPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/manage"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EventManagePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/payment-success"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PaymentSuccessPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/payment-cancel"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PaymentCancelPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
