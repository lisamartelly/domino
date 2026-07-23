import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents, type EventSummaryDto } from "../../services/api";

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

  if (loading) {
    return (
      <div className="text-charcoal-400 text-center py-20">
        Loading events...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary-50 border border-primary-200 text-primary-700 rounded-xl px-4 py-3 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-primary-500 font-bold text-[11px] tracking-[0.2em] uppercase mb-2">
          Join Us
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-charcoal-900 mb-2">
          Upcoming Events
        </h1>
        <p className="text-charcoal-500 max-w-xl">
          Meet people in person at our curated events. No pressure, just great
          company.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-charcoal-200 bg-white p-12 text-center">
          <p className="text-charcoal-400 text-[15px]">
            No upcoming events right now
          </p>
          <p className="text-charcoal-300 text-sm mt-1">
            Check back soon — we're always planning something new.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="rounded-2xl border border-charcoal-200 border-l-4 border-l-accent2-400 bg-white p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <h2 className="font-bold text-charcoal-900 text-lg group-hover:text-primary-600 transition-colors">
                {event.name}
              </h2>
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

              {/* Gradient accent line */}
              <div className="h-[2px] bg-gradient-to-r from-primary-500/30 via-accent1-500/30 to-primary-500/30 rounded-full my-4" />

              <div className="flex items-center justify-between">
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
      )}
    </div>
  );
}
