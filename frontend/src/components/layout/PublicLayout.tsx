import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      {/* Header */}
      <header className="bg-charcoal-950 border-b border-charcoal-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="shrink-0">
            <img
              src="/images/logos/DSC_Secondary_Cream.png"
              alt="Domino Social Club"
              className="h-7"
            />
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/events"
              className="text-sm text-cream-100 hover:text-white transition-colors"
            >
              Events
            </Link>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="text-sm bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-cream-100 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/login?view=register"
                  className="text-sm bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Join
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-charcoal-950 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img
            src="/images/logos/DSC_Secondary_Cream.png"
            alt="Domino Social Club"
            className="h-6"
          />
          <p className="text-charcoal-400 text-sm">
            &copy; {new Date().getFullYear()} Domino Social Club. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
