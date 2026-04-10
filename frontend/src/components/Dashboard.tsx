import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getMyMatches, type MatchSummaryDto } from "../services/api";

const statusStyle: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800",
  accepted:
    "bg-green-100 text-green-800",
  denied:
    "bg-red-100 text-red-800",
  expired:
    "bg-charcoal-100 text-charcoal-500",
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  denied: "Denied",
  expired: "Expired",
};

export function Dashboard() {
  const { user, logout } = useAuth();
  const [matches, setMatches] = useState<MatchSummaryDto[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  const isAdmin =
    user?.roles?.includes("Admin") ||
    user?.roles?.includes("SuperDuperAdmin");

  useEffect(() => {
    let cancelled = false;
    getMyMatches()
      .then((data) => {
        if (!cancelled) setMatches(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingMatches(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-cream-50">
              Dashboard
            </h1>
            {user && (
              <p className="text-charcoal-300 text-sm mt-1">
                {user.firstName} {user.lastName} &middot; {user.email}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="self-start sm:self-auto bg-charcoal-700 hover:bg-charcoal-600 text-cream-50 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Logout
          </button>
        </header>

        {/* Quick links */}
        {isAdmin && (
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/match"
              className="bg-cream-50 rounded-2xl border border-charcoal-200 p-5 shadow-lg hover:shadow-xl hover:border-primary-300 transition-all group"
            >
              <p className="font-semibold text-charcoal-900 group-hover:text-primary-700">
                Matching
              </p>
              <p className="text-sm text-charcoal-500 mt-1">
                Create new matches between members.
              </p>
            </Link>
            <Link
              to="/activity-ideas"
              className="bg-cream-50 rounded-2xl border border-charcoal-200 p-5 shadow-lg hover:shadow-xl hover:border-primary-300 transition-all group"
            >
              <p className="font-semibold text-charcoal-900 group-hover:text-primary-700">
                Activity Ideas
              </p>
              <p className="text-sm text-charcoal-500 mt-1">
                Manage the catalog of date ideas.
              </p>
            </Link>
          </section>
        )}

        {/* My matches */}
        <section className="bg-cream-50 rounded-2xl border border-charcoal-200 shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-charcoal-200 bg-white">
            <h2 className="text-lg font-semibold text-charcoal-900">
              My matches
            </h2>
          </div>

          {loadingMatches ? (
            <div className="p-8 text-center text-charcoal-500">Loading...</div>
          ) : matches.length === 0 ? (
            <div className="p-8 text-center text-charcoal-500">
              No matches yet.
            </div>
          ) : (
            <ul className="divide-y divide-charcoal-100">
              {matches.map((m) => (
                <li key={m.publicId}>
                  <Link
                    to={`/m/${m.publicId}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-primary-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-charcoal-900 truncate">
                        {m.otherUserName}
                      </p>
                      <p className="text-xs text-charcoal-500 mt-0.5">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-medium rounded-full px-2.5 py-0.5 ${statusStyle[m.status] ?? ""}`}
                    >
                      {statusLabel[m.status] ?? m.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
