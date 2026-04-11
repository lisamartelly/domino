import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { buildReturnUrlParam } from "../utils/returnUrl";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center">
        <div className="text-cream-50 text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = buildReturnUrlParam(location.pathname, location.search);
    return (
      <Navigate to={`/login?returnUrl=${returnUrl}`} replace />
    );
  }

  return <>{children}</>;
}

