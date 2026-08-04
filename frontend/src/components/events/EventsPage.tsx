import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents, type EventSummaryDto } from "../../services/api";
import { EventCardScroller } from "./EventCardScroller";

function formatCost(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

const frequencyLabels: Record<string, string> = {
  ONCE: "One-time",
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Monthly",
};

export function EventsPage() {
  const [events, setEvents] = useState<EventSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getEvents()
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Intro */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-cream-50 tracking-wide uppercase">
          Events
        </h1>
        <p className="text-cream-100 text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
          The best connections happen when we have something in common and
          opportunities to see each other more than once. Our events are
          centered around shared interests, welcoming environments, and genuine
          conversation — no awkward mixers or endless swiping.
        </p>
      </div>

      {/* Featured scroller */}
      <div className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10 mb-10">
        <h2 className="text-xl font-bold text-accent1-500 mb-6">
          Featured Events
        </h2>
        <EventCardScroller />
      </div>

      {/* Full listing */}
      <div className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10">
        <h2 className="text-xl font-bold text-accent1-500 mb-6">
          All Upcoming Events
        </h2>

        {loading && (
          <div className="text-charcoal-500 text-center py-20">
            Loading events...
          </div>
        )}

        {error && (
          <div className="bg-primary-50 border-2 border-primary-300 text-primary-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-accent1-500/50 bg-white p-12 text-center">
            <p className="text-charcoal-500 text-[15px]">
              No upcoming events right now
            </p>
            <p className="text-charcoal-400 text-sm mt-1">
              Check back soon — we're always planning something new.
            </p>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="rounded-2xl border-3 border-accent1-500 bg-white p-6 hover:bg-accent1-50 transition-all group"
              >
                <h3 className="font-bold text-charcoal-900 text-lg group-hover:text-accent1-600 transition-colors">
                  {event.name}
                </h3>
                <p className="text-sm text-charcoal-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>

                <div className="mt-4 space-y-1 text-sm text-charcoal-500">
                  <div className="flex justify-between">
                    <span>{formatDate(event.startTime)}</span>
                    <span>{formatTime(event.startTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{event.location}</span>
                    <span>{event.durationMinutes} min</span>
                  </div>
                  {event.frequencyType !== "ONCE" && (
                    <div className="text-charcoal-400 text-xs mt-1">
                      {frequencyLabels[event.frequencyType] ??
                        event.frequencyType}{" "}
                      · {event.frequencyCount} sessions
                    </div>
                  )}
                </div>

                <div className="h-[2px] bg-accent1-500/30 rounded-full my-4" />

                <div className="flex items-center justify-between">
                  <span
                    className={`font-bold text-sm ${
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
        )}
      </div>
    </div>
  );
}
