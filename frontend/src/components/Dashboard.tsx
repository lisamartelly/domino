import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getMyMatches, type MatchSummaryDto } from "../services/api";

const statusStyle: Record<string, string> = {
  pending: "bg-accent2-200 text-accent2-800",
  accepted: "bg-accent1-100 text-accent1-800",
  denied: "bg-primary-100 text-primary-800",
  expired: "bg-charcoal-100 text-charcoal-500",
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  denied: "Denied",
  expired: "Expired",
};

export function Dashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchSummaryDto[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  const isAdmin =
    user?.roles?.includes("Admin") ||
    user?.roles?.includes("SuperDuperAdmin");

  useEffect(() => {
    if (isAdmin) {
      setLoadingMatches(false);
      return;
    }
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
  }, [isAdmin]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-charcoal-900">
          Dashboard
        </h1>
        {user && (
          <p className="text-charcoal-500 text-sm mt-1">
            {user.firstName} {user.lastName} &middot; {user.email}
          </p>
        )}
      </div>

      {isAdmin && (
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/match"
            className="rounded-2xl border-l-4 border-l-primary-500 border border-charcoal-200 bg-white p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <p className="font-semibold text-primary-600 group-hover:text-primary-700">
              Matching
            </p>
            <p className="text-sm text-charcoal-500 mt-1">
              Create new matches between members.
            </p>
          </Link>
          <Link
            to="/activity-ideas"
            className="rounded-2xl border-l-4 border-l-primary-500 border border-charcoal-200 bg-white p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <p className="font-semibold text-primary-600 group-hover:text-primary-700">
              Activity Ideas
            </p>
            <p className="text-sm text-charcoal-500 mt-1">
              Manage the catalog of date ideas.
            </p>
          </Link>
        </section>
      )}

      {!isAdmin && (
        <section className="rounded-2xl border border-charcoal-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-charcoal-100">
            <h2 className="text-lg font-semibold text-charcoal-900">
              My matches
            </h2>
          </div>

          {loadingMatches ? (
            <div className="p-8 text-center text-charcoal-400">Loading...</div>
          ) : matches.length === 0 ? (
            <div className="p-8 text-center text-charcoal-400">
              No matches yet.
            </div>
          ) : (
            <ul className="divide-y divide-charcoal-100">
              {matches.map((m) => (
                <li key={m.publicId}>
                  <Link
                    to={`/m/${m.publicId}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-accent2-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-charcoal-900 truncate">
                        {m.otherUserName}
                      </p>
                      <p className="text-xs text-charcoal-400 mt-0.5">
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
      )}
    </div>
  );
}
