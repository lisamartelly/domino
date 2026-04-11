import { useEffect } from "react";
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
import {
  buildReturnUrlParam,
  resolveAfterIntakeComplete,
  resolvePostLoginTarget,
} from "./utils/returnUrl";

function PostAuthRedirect() {
  const { hasCompletedIntake } = useAuth();
  const location = useLocation();
  const to = resolvePostLoginTarget(location.search, hasCompletedIntake);
  return <Navigate to={to} replace />;
}

function AppRoutes() {
  const { isAuthenticated, hasCompletedIntake, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const publicPaths = ["/", "/login"];

  // Redirect to intake if authenticated but hasn't completed it
  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      !hasCompletedIntake &&
      location.pathname !== "/intake" &&
      !publicPaths.includes(location.pathname)
    ) {
      const pending = buildReturnUrlParam(location.pathname, location.search);
      navigate(`/intake?returnUrl=${pending}`, { replace: true });
    }
  }, [isAuthenticated, hasCompletedIntake, isLoading, location.pathname, location.search, navigate]);

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

  // Handle navigation after logout
  useEffect(() => {
    if (
      !isLoading &&
      !isAuthenticated &&
      !publicPaths.includes(location.pathname)
    ) {
      navigate("/", { replace: true });
    }
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
