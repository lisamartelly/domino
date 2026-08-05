import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents, type EventSummaryDto } from "../../services/api";

const PLACEHOLDER_IMAGES = [
  "/images/hero/crafty.jpg",
  "/images/hero/book-club.jpg",
  "/images/hero/card-game.jpg",
  "/images/hero/catan.jpg",
  "/images/hero/hikers.jpg",
  "/images/about/plant-boys.jpg",
  "/images/about/happy-girls.jpg",
  "/images/about/sparklers.jpg",
];

const FREQUENCY_LABELS: Record<string, string> = {
  ONCE: "One-time",
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function eventImage(eventId: number): string {
  return PLACEHOLDER_IMAGES[eventId % PLACEHOLDER_IMAGES.length];
}

function EventCard({ event }: { event: EventSummaryDto }) {
  const isGathering = event.phase === "gathering";
  const recurrence =
    FREQUENCY_LABELS[event.frequencyType] ?? event.frequencyType;
  const isRecurring = event.frequencyType !== "ONCE";

  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex flex-col h-full overflow-hidden rounded-2xl bg-white border-3 border-accent1-500 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={eventImage(event.id)}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badge */}
        <span
          className={`absolute top-2 left-2 rounded-lg px-2 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${
            isGathering
              ? "bg-accent1-500/90 text-white"
              : isRecurring
                ? "bg-accent1-500 text-white"
                : "bg-cream-50 text-charcoal-700"
          }`}
        >
          {isGathering ? "Gauging Interest" : recurrence}
        </span>
      </div>

      {/* Content */}
      <div className="px-2.5 py-2.5 md:px-3 md:py-3 flex-1 flex flex-col">
        <h3 className="text-xs md:text-sm font-bold text-charcoal-900 leading-snug line-clamp-2 group-hover:text-accent1-600 transition-colors">
          {event.name}
        </h3>
        <p className="mt-auto pt-1 text-[10px] md:text-xs font-medium text-charcoal-500">
          {isGathering ? (
            <span className="text-accent1-600">Sign up to show interest</span>
          ) : (
            <>
              {event.startTime && formatDate(event.startTime)}
              {isRecurring && event.frequencyCount > 1 && (
                <span className="text-charcoal-400">
                  {" · "}
                  {event.frequencyCount} sessions
                </span>
              )}
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

interface EventCardScrollerProps {
  events?: EventSummaryDto[];
}

export function EventCardScroller({ events: externalEvents }: EventCardScrollerProps) {
  const [fetchedEvents, setFetchedEvents] = useState<EventSummaryDto[]>([]);
  const [loading, setLoading] = useState(!externalEvents);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalEvents) return;
    let cancelled = false;
    getEvents()
      .then((data) => {
        if (!cancelled) setFetchedEvents(data.filter((e) => e.phase === "scheduled"));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [externalEvents]);

  const events = externalEvents ?? fetchedEvents;

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -el.clientWidth * 0.8 : el.clientWidth * 0.8,
      behavior: "smooth",
    });
  }

  if (loading) {
    return (
      <div className="text-charcoal-500 text-center py-12">
        Loading events...
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="relative group/scroller">
      <button
        type="button"
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full bg-cream-50 border-2 border-accent1-500 items-center justify-center hover:bg-accent1-50 transition-all opacity-0 group-hover/scroller:opacity-100 hidden md:flex"
        aria-label="Scroll left"
      >
        <svg className="w-4 h-4 text-charcoal-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full bg-cream-50 border-2 border-accent1-500 items-center justify-center hover:bg-accent1-50 transition-all opacity-0 group-hover/scroller:opacity-100 hidden md:flex"
        aria-label="Scroll right"
      >
        <svg className="w-4 h-4 text-charcoal-700" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div
        ref={scrollRef}
        className="grid grid-flow-col auto-cols-[calc((100%-0.5rem*2)/3)] md:auto-cols-[calc((100%-0.75rem*5)/6)] gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory items-stretch"
      >
        {events.map((event) => (
          <div key={event.id} className="snap-start min-w-0 h-full">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  );
}
