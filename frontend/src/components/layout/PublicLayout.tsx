import { type ReactNode, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { NewsletterSignup } from "../NewsletterSignup";

const NAV_LINKS = [
  { to: "/about", label: "About" },
  { to: "/events", label: "Events" },
  { to: "/matchmaking", label: "Matchmaking" },
  { to: "/contact", label: "Contact" },
] as const;

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `text-sm font-bold tracking-wide uppercase transition-colors ${
    isActive
      ? "text-accent1-500"
      : "text-cream-100 hover:text-white"
  }`;
}

export function PublicLayout({
  children,
  flush = false,
}: {
  children: ReactNode;
  flush?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  if (location.pathname !== prevPath.current) {
    prevPath.current = location.pathname;
    if (mobileOpen) setMobileOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-primary-500">
      {/* ── Nav bar ── */}
      <header className="bg-charcoal-500 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link to="/" className="shrink-0">
            <img
              src="/images/logos/DSC_Wordmark_Horizontal_Sedona.png"
              alt="Domino Social Club"
              className="h-7"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="text-sm bg-accent1-500 hover:bg-accent1-600 text-white font-bold py-2 px-5 rounded-xl transition-colors"
              >
                Dashboard
              </Link>
            ) : null}
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden text-white p-1"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <nav className="md:hidden bg-charcoal-600 border-t border-charcoal-400/30 px-6 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `block text-sm font-bold tracking-wide uppercase transition-colors ${
                    isActive ? "text-accent1-500" : "text-cream-100 hover:text-white"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="block text-sm text-cream-100 hover:text-white font-bold transition-colors"
              >
                Dashboard
              </Link>
            ) : null}
          </nav>
        )}
      </header>

      {/* ── Content ── */}
      <main className="flex-1">
        {flush ? children : (
          <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="py-12 px-6">
        <div className="max-w-5xl mx-auto bg-cream-50 border-4 border-accent1-500 rounded-3xl p-8 md:p-12">
          {/* Newsletter */}
          <div id="newsletter" className="text-center mb-10">
            <h3 className="text-2xl font-bold text-accent1-500 mb-2">
              Stay in the Loop
            </h3>
            <p className="text-charcoal-500 text-sm mb-6 max-w-md mx-auto">
              Be the first to hear about upcoming events, new experiences, and
              opportunities to meet incredible people in the Twin Cities.
            </p>
            <div className="max-w-md mx-auto">
              <NewsletterSignup />
            </div>
          </div>

          {/* Social links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-10">
            <a
              href="https://instagram.com/dominosocial.club"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-charcoal-500 hover:text-primary-600 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <span>@dominosocial.club</span>
            </a>
            <a
              href="https://tiktok.com/@dominosocialclub"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-charcoal-500 hover:text-primary-600 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
              </svg>
              <span>@dominosocialclub</span>
            </a>
            <a
              href="mailto:hello@dominosocial.club"
              className="flex items-center gap-2 text-charcoal-500 hover:text-primary-600 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span>hello@dominosocial.club</span>
            </a>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-accent1-500/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <img
              src="/images/logos/DSC_Secondary_Cream.png"
              alt="Domino Social Club"
              className="h-6 brightness-0 opacity-20"
            />
            <p className="text-charcoal-400 text-sm">
              &copy; {new Date().getFullYear()} Domino Social Club. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
