import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    year: "numeric",
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
  const navigate = useNavigate();

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
      <div className="text-charcoal-400 text-center py-12">
        Loading events...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-primary-50 border border-primary-200 text-primary-700 rounded-lg px-4 py-3 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-charcoal-900">
          Events
        </h1>
        <p className="text-charcoal-500 mt-1">
          Browse upcoming events and register.
        </p>
      </header>

      {events.length === 0 ? (
        <p className="text-charcoal-400 text-center py-12">
          No upcoming events right now. Check back soon!
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => navigate(`/events/${event.id}`)}
              className="rounded-2xl border border-charcoal-200 bg-white p-5 shadow-sm text-left hover:shadow-md transition-shadow border-l-4 border-l-accent2-400"
            >
              <h2 className="font-semibold text-charcoal-900 text-lg">
                {event.name}
              </h2>
              <p className="text-sm text-charcoal-500 mt-1 line-clamp-2">
                {event.description}
              </p>

              <div className="mt-4 space-y-1 text-sm text-charcoal-600">
                <div className="flex justify-between">
                  <span>{formatDate(event.startTime)}</span>
                  <span>{formatTime(event.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{event.location}</span>
                  <span>{event.durationMinutes} min</span>
                </div>
                {event.frequencyType !== "ONCE" && (
                  <div className="text-charcoal-400">
                    {frequencyLabels[event.frequencyType] ?? event.frequencyType}{" "}
                    &middot; {event.frequencyCount} sessions
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`font-semibold ${
                    event.costCents === 0
                      ? "text-accent2-600"
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
