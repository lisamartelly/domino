import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation handled by App.tsx redirect logic
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-cream-50 rounded-2xl p-8 border-2 border-charcoal-200 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-charcoal-900 mb-2">
              Welcome to Dashboard
            </h1>
            <p className="text-charcoal-600 text-sm">
              You are successfully authenticated
            </p>
          </div>

          {user && (
            <div className="space-y-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-charcoal-200">
                <p className="text-sm text-charcoal-600 mb-1">Email</p>
                <p className="text-charcoal-900 font-medium">{user.email}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-charcoal-200">
                <p className="text-sm text-charcoal-600 mb-1">Name</p>
                <p className="text-charcoal-900 font-medium">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
          )}

          <Link
            to="/match"
            className="block w-full text-center bg-secondary-500 hover:bg-secondary-600 text-cream-50 font-semibold py-3 px-4 rounded-lg transition-all duration-200 mb-4 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:ring-offset-2 focus:ring-offset-cream-50"
          >
            Go to matching
          </Link>

          <button
            onClick={handleLogout}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-cream-50"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
