import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents, type EventSummaryDto } from "../../services/api";
import { EventCardScroller } from "./EventCardScroller";
import { EventCalendar } from "./EventCalendar";

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

  const scheduledEvents = useMemo(
    () => events.filter((e) => e.phase === "scheduled"),
    [events]
  );
  const gatheringEvents = useMemo(
    () => events.filter((e) => e.phase === "gathering"),
    [events]
  );

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

      {/* Upcoming events scroller — hidden when no scheduled events */}
      {!loading && scheduledEvents.length > 0 && (
        <div className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10 mb-10">
          <h2 className="text-xl font-bold text-accent1-500 mb-6">
            Upcoming Events
          </h2>
          <EventCardScroller events={scheduledEvents} />
        </div>
      )}

      {/* Gathering Interest section */}
      {!loading && gatheringEvents.length > 0 && (
        <div className="bg-cream-50 border-4 border-dashed border-accent1-500 rounded-3xl p-6 md:p-10 mb-10">
          <h2 className="text-xl font-bold text-accent1-500 mb-2">
            Gathering Interest
          </h2>
          <p className="text-charcoal-500 text-sm mb-6">
            These events aren't scheduled yet — sign up to let us know you're
            interested and we'll make it happen!
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {gatheringEvents.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="rounded-2xl border-3 border-accent1-500 bg-white p-6 hover:bg-accent1-50 transition-all group flex flex-col"
              >
                <h3 className="font-bold text-charcoal-900 text-lg group-hover:text-accent1-600 transition-colors">
                  {event.name}
                </h3>
                <p className="text-sm text-charcoal-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>
                {event.anticipatedPriceRange && (
                  <p className="text-sm text-charcoal-600 mt-2">
                    <span className="font-medium">Est. price:</span>{" "}
                    {event.anticipatedPriceRange}
                  </p>
                )}
                <div className="h-[2px] bg-accent1-500/30 rounded-full my-4 mt-auto" />
                <div className="flex items-center justify-end">
                  <span className="text-xs font-bold text-accent1-500 uppercase tracking-wide">
                    I'm Interested →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Calendar view */}
      <div className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10">
        <h2 className="text-xl font-bold text-accent1-500 mb-6">
          Calendar
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

        {!loading && !error && <EventCalendar events={scheduledEvents} />}
      </div>
    </div>
  );
}
