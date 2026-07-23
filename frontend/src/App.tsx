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
import { IntakePage } from "./components/IntakePage";
import { Dashboard } from "./components/Dashboard";
import { MatchSection } from "./components/matching/MatchSection";
import { MatchViewPage } from "./components/matching/MatchViewPage";
import { ActivityIdeasPage } from "./components/ActivityIdeasPage";
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

function AppRoutes() {
  const { isAuthenticated, hasCompletedIntake, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  /** Tracks auth after initial check so we only send users home on logout, not on cold deep-links while logged out. */
  const authAfterLoad = useRef<boolean | null>(null);

  const publicPaths = ["/", "/login", "/events"];

  // Redirect away from intake once completed
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

  // After logout (or session loss), leave protected areas — not on first load already logged out
  useEffect(() => {
    if (isLoading) return;

    const wasAuthenticated = authAfterLoad.current;
    const isPublicPath =
      publicPaths.includes(location.pathname) ||
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
      <Route
        path="/"
        element={
          isAuthenticated ? <PostAuthRedirect /> : <LandingPage />
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <PostAuthRedirect /> : <AuthPage />
        }
      />
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
        path="/events"
        element={
          <PublicLayout>
            <EventsPage />
          </PublicLayout>
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
      <Route
        path="/events/:id"
        element={
          <PublicLayout>
            <EventDetailPage />
          </PublicLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
