import { useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", adminOnly: false },
  { to: "/match", label: "Matching", adminOnly: true },
  { to: "/activity-ideas", label: "Activity Ideas", adminOnly: true },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin =
    user?.roles?.includes("Admin") ||
    user?.roles?.includes("SuperDuperAdmin");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const visibleNav = navItems.filter((n) => !n.adminOnly || isAdmin);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-60 flex flex-col
          bg-charcoal-900 border-r border-charcoal-800
          transform transition-transform duration-200
          lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-charcoal-800 relative">
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent1-500" />
          <img
            src="/images/logos/DSC_Secondary_Cream.png"
            alt="Domino"
            className="w-[85%] h-auto mx-auto"
          />
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-500/20 text-cream-50 border-l-[3px] border-accent1-500 pl-2.5 pr-3"
                    : "text-charcoal-400 hover:bg-charcoal-800 hover:text-cream-50 px-3"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-charcoal-800 space-y-3">
          {user && (
            <p className="text-sm text-charcoal-300 truncate">
              {user.firstName} {user.lastName}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-charcoal-400 hover:text-cream-50 transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-charcoal-900 border-b border-charcoal-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-cream-50 p-1"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <img
            src="/images/logos/DSC_Secondary_Cream.png"
            alt="Domino"
            className="h-6 w-auto"
          />
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto bg-cream-50">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
