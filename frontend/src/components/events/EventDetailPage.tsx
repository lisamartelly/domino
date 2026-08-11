import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import {
  getEvent,
  registerForEvent,
  cancelEventRegistration,
  getMyEventRegistrations,
  type EventDto,
  type EventRegistrationDto,
} from "../../services/api";
import { EventInterestForm } from "./EventInterestForm";

function formatCost(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (rem === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours}h ${rem}m`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const frequencyLabels: Record<string, string> = {
  ONCE: "One-time event",
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Monthly",
};

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { registrationEnabled } = useAppSettings();
  const [event, setEvent] = useState<EventDto | null>(null);
  const [myReg, setMyReg] = useState<EventRegistrationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    const eventPromise = getEvent(parseInt(id, 10));
    const regsPromise = isAuthenticated
      ? getMyEventRegistrations()
      : Promise.resolve([] as EventRegistrationDto[]);

    Promise.all([eventPromise, regsPromise])
      .then(([eventData, regs]) => {
        setEvent(eventData);
        const match = regs.find(
          (r) => r.eventId === eventData.id && r.status !== "cancelled"
        );
        setMyReg(match ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id, isAuthenticated]);

  const handleRegister = async () => {
    if (!event) return;

    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`/events/${event.id}`);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const result = await registerForEvent(event.id);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        load();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!event) return;
    if (!window.confirm("Cancel your registration for this event?")) return;
    setActionLoading(true);
    setError(null);
    try {
      await cancelEventRegistration(event.id);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-charcoal-400 text-center py-20">
        Loading event...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-charcoal-400 text-center py-20">
        Event not found.
      </div>
    );
  }

  const isGathering = event.phase === "gathering";
  const isFull =
    event.capacity !== null &&
    event.registrationCount >= event.capacity;
  const isRegistered = !!myReg;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        to="/events"
        className="inline-block text-sm text-white hover:text-accent1-500 transition-colors mb-6"
      >
        ← Back to Events
      </Link>

      {/* Main card */}
      <div className="rounded-3xl bg-cream-50 border-4 border-accent1-500 overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-primary-500 font-bold text-[11px] tracking-[0.2em] uppercase mb-2">
                  {isGathering ? "Gathering Interest" : "Event"}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-charcoal-900">
                  {event.name}
                </h1>
              </div>
              {!isGathering && (
                <span
                  className={`text-2xl font-bold shrink-0 ${
                    event.costCents === 0
                      ? "text-green-700"
                      : "text-charcoal-900"
                  }`}
                >
                  {formatCost(event.costCents)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-charcoal-600 leading-relaxed mb-8 whitespace-pre-line">
              {event.description}
            </p>

            {/* Info Grid */}
            {isGathering ? (
              <div className="grid grid-cols-2 gap-5 text-sm mb-8">
                {event.location && (
                  <div className="rounded-xl bg-cream-50 p-4">
                    <span className="text-charcoal-400 text-xs font-medium uppercase tracking-wider block mb-1">
                      Location
                    </span>
                    <span className="text-charcoal-900 font-semibold">
                      {event.location}
                    </span>
                  </div>
                )}
                <div className="rounded-xl bg-cream-50 p-4">
                  <span className="text-charcoal-400 text-xs font-medium uppercase tracking-wider block mb-1">
                    Date
                  </span>
                  <span className="text-charcoal-900 font-semibold">
                    TBD — based on interest
                  </span>
                </div>
                {event.anticipatedPriceRange && (
                  <div className="rounded-xl bg-cream-50 p-4">
                    <span className="text-charcoal-400 text-xs font-medium uppercase tracking-wider block mb-1">
                      Est. Price
                    </span>
                    <span className="text-charcoal-900 font-semibold">
                      {event.anticipatedPriceRange}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 text-sm mb-8">
                <div className="rounded-xl bg-cream-50 p-4">
                  <span className="text-charcoal-400 text-xs font-medium uppercase tracking-wider block mb-1">
                    Location
                  </span>
                  <span className="text-charcoal-900 font-semibold">
                    {event.location}
                  </span>
                </div>
                {event.frequencyType === "ONCE" && event.occurrences.length > 0 ? (
                  <div className="rounded-xl bg-cream-50 p-4">
                    <span className="text-charcoal-400 text-xs font-medium uppercase tracking-wider block mb-1">
                      Date & Time
                    </span>
                    <span className="text-charcoal-900 font-semibold">
                      {formatDateTime(event.occurrences[0].startTime)}
                    </span>
                  </div>
                ) : (
                  <div className="rounded-xl bg-cream-50 p-4">
                    <span className="text-charcoal-400 text-xs font-medium uppercase tracking-wider block mb-1">
                      Schedule
                    </span>
                    <span className="text-charcoal-900 font-semibold">
                      {frequencyLabels[event.frequencyType] ??
                        event.frequencyType}
                      {event.frequencyCount > 1 &&
                        ` · ${event.frequencyCount} sessions`}
                    </span>
                  </div>
                )}
                <div className="rounded-xl bg-cream-50 p-4">
                  <span className="text-charcoal-400 text-xs font-medium uppercase tracking-wider block mb-1">
                    Duration
                  </span>
                  <span className="text-charcoal-900 font-semibold">
                    {formatDuration(event.durationMinutes)}
                  </span>
                </div>
                <div className="rounded-xl bg-cream-50 p-4">
                  <span className="text-charcoal-400 text-xs font-medium uppercase tracking-wider block mb-1">
                    Availability
                  </span>
                  <span className={`font-semibold ${isFull ? "text-primary-600" : "text-green-700"}`}>
                    {event.capacity === null ? "Open" : isFull ? "Full" : "Open"}
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-primary-50 border border-primary-200 text-primary-700 rounded-xl px-4 py-3 text-sm mb-6">
                {error}
              </div>
            )}

            {/* Actions */}
            {isGathering && event.status === "published" && (
              <div>
                <h2 className="text-lg font-bold text-charcoal-900">
                  Sign up if you're interested!
                </h2>
                <p className=" mb-4">We'll email you when it's scheduled</p>
                <EventInterestForm eventId={event.id} />
              </div>
            )}

            {!isGathering && event.status === "published" && !isAuthenticated && !registrationEnabled && (
              <div>
                <h2 className="text-lg font-bold text-charcoal-900">
                  Sign up for this event
                </h2>
                <p className="text-charcoal-500 text-sm mb-4">
                  Fill out the form below and we'll get you set up.
                </p>
                <EventInterestForm eventId={event.id} mode="registration" />
              </div>
            )}

            {!isGathering && event.status === "published" && (isAuthenticated || registrationEnabled) && (
              <div>
                {isRegistered ? (
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold bg-green-100 text-green-800 px-4 py-2 rounded-xl">
                      ✓ Registered ({myReg!.status})
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelRegistration}
                      disabled={actionLoading}
                      className="text-sm text-charcoal-400 hover:text-primary-600 underline underline-offset-4 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading
                        ? "Cancelling..."
                        : "Cancel registration"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={actionLoading || isFull}
                    className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/25"
                  >
                    {actionLoading
                      ? "Processing..."
                      : isFull
                      ? "Event Full"
                      : !isAuthenticated
                      ? "Sign up to register"
                      : event.costCents === 0
                      ? "Register"
                      : `Register — ${formatCost(event.costCents)}`}
                  </button>
                )}
              </div>
            )}
          </div>
      </div>

      {/* Upcoming sessions (only for recurring events) */}
      {!isGathering && event.frequencyType !== "ONCE" && event.occurrences.length > 0 && (
        <div className="mt-8">
          <div className="mb-4">
            <p className="text-primary-500 font-bold text-[11px] tracking-[0.2em] uppercase mb-1">
              {frequencyLabels[event.frequencyType] ?? event.frequencyType} Series
            </p>
            <h2 className="text-lg font-bold text-charcoal-900">
              {event.occurrences.length} Upcoming Sessions
            </h2>
          </div>
          <div className="space-y-2">
            {event.occurrences.map((occ, i) => (
              <div
                key={occ.id}
                className={`flex items-center justify-between text-sm py-3 px-4 rounded-xl ${
                  occ.isCancelled
                    ? "bg-charcoal-100 text-charcoal-400 line-through"
                    : "bg-white border border-charcoal-200 text-charcoal-700"
                }`}
              >
                <span className="font-medium">
                  Session {i + 1}
                </span>
                <span className={occ.isCancelled ? "text-charcoal-400" : "text-charcoal-900"}>
                  {formatDateTime(occ.startTime)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
