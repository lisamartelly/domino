import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getMyMatches,
  getEvents,
  type MatchSummaryDto,
  type EventSummaryDto,
} from "../services/api";

const statusStyle: Record<string, string> = {
  pending: "bg-accent1-100 text-accent1-800",
  accepted: "bg-green-100 text-green-800",
  denied: "bg-primary-100 text-primary-800",
  expired: "bg-charcoal-100 text-charcoal-500",
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  denied: "Denied",
  expired: "Expired",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCost(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

function timeLeft(createdAt: string): string {
  const expires = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;
  const diff = expires - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${h}h ${m}m left`;
}

export function Dashboard() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchSummaryDto[]>([]);
  const [events, setEvents] = useState<EventSummaryDto[]>([]);
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

  useEffect(() => {
    if (isAdmin) return;
    getEvents()
      .then((data) => setEvents(data.slice(0, 3)))
      .catch(() => {});
  }, [isAdmin]);

  const hasCompletedIntake = user?.hasCompletedIntake ?? true;
  const pendingMatches = matches.filter((m) => m.status === "pending");
  const pastMatches = matches.filter((m) => m.status !== "pending");

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-primary-500/[0.07] via-accent1-500/[0.08] to-primary-500/[0.04] border border-primary-400/15 rounded-2xl px-8 py-8 mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-charcoal-900">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-charcoal-500 mt-1.5">
          {isAdmin
            ? "Manage matches, events, and activity ideas."
            : pendingMatches.length > 0
            ? `You have ${pendingMatches.length} match${pendingMatches.length > 1 ? "es" : ""} waiting for your response.`
            : "Your matchmakers are working on your next introduction."}
        </p>
      </div>

      {/* Intake CTA */}
      {!isAdmin && !hasCompletedIntake && (
        <Link
          to="/intake"
          className="block rounded-2xl border-l-4 border-l-accent1-500 border border-charcoal-200 bg-accent1-50 p-6 shadow-sm hover:shadow-md transition-all mb-10"
        >
          <p className="font-semibold text-charcoal-900 text-lg">
            Complete your profile
          </p>
          <p className="text-sm text-charcoal-500 mt-1">
            Fill out a quick questionnaire so our matchmakers can find your
            perfect match.
          </p>
        </Link>
      )}

      {/* Admin Links */}
      {isAdmin && (
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
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
          <Link
            to="/events/manage"
            className="rounded-2xl border-l-4 border-l-primary-500 border border-charcoal-200 bg-white p-5 shadow-sm hover:shadow-md transition-all group"
          >
            <p className="font-semibold text-primary-600 group-hover:text-primary-700">
              Manage Events
            </p>
            <p className="text-sm text-charcoal-500 mt-1">
              Create and manage upcoming events.
            </p>
          </Link>
        </section>
      )}

      {/* Matches Section — regular users */}
      {!isAdmin && (
        <>
          <p className="text-primary-500 font-bold text-[11px] tracking-[0.2em] uppercase mb-2">
            Your Matches
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-charcoal-900 mb-5">
            Recent introductions
          </h2>

          {loadingMatches ? (
            <div className="rounded-2xl border border-dashed border-charcoal-200 bg-white p-12 text-center text-charcoal-400">
              Loading...
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-charcoal-200 bg-white p-12 text-center">
              <p className="text-charcoal-400 text-[15px]">No matches yet</p>
              <p className="text-charcoal-300 text-sm mt-1">
                When your matchmakers pair you with someone, it'll show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pending matches — prominent */}
              {pendingMatches.map((m) => (
                <Link
                  key={m.publicId}
                  to={`/m/${m.publicId}`}
                  className="block rounded-2xl border border-charcoal-200 border-l-4 border-l-accent1-500 bg-gradient-to-r from-white to-accent1-500/[0.03] p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent2-200 to-accent2-400 flex items-center justify-center text-primary-600 font-bold text-lg shrink-0">
                      {getInitials(m.otherUserName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-charcoal-900 text-[17px]">
                        {m.otherUserName}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span
                          className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${statusStyle[m.status] ?? ""}`}
                        >
                          {statusLabel[m.status] ?? m.status}
                        </span>
                        <span className="text-xs text-charcoal-400">
                          {timeLeft(m.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span className="text-primary-500 text-sm font-semibold shrink-0">
                      Respond →
                    </span>
                  </div>
                </Link>
              ))}

              {/* Past matches */}
              {pastMatches.map((m) => (
                <Link
                  key={m.publicId}
                  to={`/m/${m.publicId}`}
                  className="block rounded-2xl border border-charcoal-200 border-l-4 border-l-primary-400 bg-white p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent2-200 to-accent2-400 flex items-center justify-center text-primary-600 font-bold text-lg shrink-0">
                      {getInitials(m.otherUserName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-charcoal-900 text-[17px]">
                        {m.otherUserName}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span
                          className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${statusStyle[m.status] ?? ""}`}
                        >
                          {statusLabel[m.status] ?? m.status}
                        </span>
                        <span className="text-xs text-charcoal-400">
                          {new Date(m.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Gradient Divider */}
          {events.length > 0 && (
            <>
              <div className="h-[3px] bg-gradient-to-r from-primary-500 via-accent1-500 to-primary-500 rounded-full my-10" />

              <p className="text-primary-500 font-bold text-[11px] tracking-[0.2em] uppercase mb-2">
                Upcoming
              </p>
              <h2 className="text-xl md:text-2xl font-bold text-charcoal-900 mb-5">
                Events near you
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="rounded-2xl border border-charcoal-200 border-l-4 border-l-accent2-400 bg-white p-5 shadow-sm hover:shadow-md transition-all"
                  >
                    <h3 className="font-bold text-charcoal-900 text-base mb-1">
                      {event.name}
                    </h3>
                    <p className="text-sm text-charcoal-500 line-clamp-2 mb-3">
                      {event.description}
                    </p>
                    <div className="space-y-0.5 text-sm text-charcoal-500">
                      <div>
                        {formatEventDate(event.startTime)} ·{" "}
                        {formatEventTime(event.startTime)}
                      </div>
                      <div>{event.location}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={`font-semibold text-sm ${
                          event.costCents === 0
                            ? "text-green-700"
                            : "text-charcoal-900"
                        }`}
                      >
                        {formatCost(event.costCents)}
                      </span>
                      <span className="text-xs text-charcoal-400">
                        {event.spotsRemaining !== null
                          ? `${event.spotsRemaining} spots left`
                          : "Open"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-6">
                <Link
                  to="/events"
                  className="text-primary-600 hover:text-primary-700 font-semibold text-sm underline underline-offset-4"
                >
                  View all events →
                </Link>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
