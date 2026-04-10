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
import { Dashboard } from "./components/Dashboard";
import { MatchSection } from "./components/matching/MatchSection";
import { MatchViewPage } from "./components/matching/MatchViewPage";
import { ActivityIdeasPage } from "./components/ActivityIdeasPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MatchFlowProvider } from "./contexts/MatchFlowContext";
import { AppLayout } from "./components/layout/AppLayout";

function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const publicPaths = ["/", "/login"];

  // Handle navigation after login
  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      user &&
      publicPaths.includes(location.pathname)
    ) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, user, location.pathname, navigate]);

  // Handle navigation after logout — send to landing page, not login
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
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />
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
