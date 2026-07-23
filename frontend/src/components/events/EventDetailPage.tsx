import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  getEvent,
  registerForEvent,
  cancelEventRegistration,
  getMyEventRegistrations,
  type EventDto,
  type EventRegistrationDto,
} from "../../services/api";

function formatCost(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
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

  const isFull =
    event.capacity !== null &&
    event.registrationCount >= event.capacity;
  const isRegistered = !!myReg;
  const spotsRemaining =
    event.capacity !== null
      ? Math.max(0, event.capacity - event.registrationCount)
      : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        to="/events"
        className="inline-block text-sm text-charcoal-400 hover:text-primary-500 transition-colors mb-6"
      >
        ← Back to Events
      </Link>

      {/* Main card */}
      <div className="relative">
        {/* Subtle gradient border */}
        <div className="absolute -inset-[1px] rounded-[26px] bg-gradient-to-br from-primary-400/20 via-accent1-400/20 to-primary-400/20" />

        <div className="relative rounded-3xl bg-white border border-charcoal-200 shadow-sm overflow-hidden">
          {/* Accent bar */}
          <div className="h-[3px] bg-gradient-to-r from-primary-500 via-accent1-500 to-primary-500" />

          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-primary-500 font-bold text-[11px] tracking-[0.2em] uppercase mb-2">
                  Event
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-charcoal-900">
                  {event.name}
                </h1>
                <span
                  className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    event.status === "published"
                      ? "bg-green-100 text-green-800"
                      : event.status === "cancelled"
                      ? "bg-primary-100 text-primary-700"
                      : "bg-charcoal-100 text-charcoal-600"
                  }`}
                >
                  {event.status}
                </span>
              </div>
              <span
                className={`text-2xl font-bold shrink-0 ${
                  event.costCents === 0
                    ? "text-green-700"
                    : "text-charcoal-900"
                }`}
              >
                {formatCost(event.costCents)}
              </span>
            </div>

            {/* Description */}
            <p className="text-charcoal-600 leading-relaxed mb-8">
              {event.description}
            </p>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-5 text-sm mb-8">
              <div className="rounded-xl bg-cream-50 p-4">
                <span className="text-charcoal-400 text-xs font-medium uppercase tracking-wider block mb-1">
                  Location
                </span>
                <span className="text-charcoal-900 font-semibold">
                  {event.location}
                </span>
              </div>
              <div className="rounded-xl bg-cream-50 p-4">
                <span className="text-charcoal-400 text-xs font-medium uppercase tracking-wider block mb-1">
                  Duration
                </span>
                <span className="text-charcoal-900 font-semibold">
                  {event.durationMinutes} min
                </span>
              </div>
              <div className="rounded-xl bg-cream-50 p-4">
                <span className="text-charcoal-400 text-xs font-medium uppercase tracking-wider block mb-1">
                  Schedule
                </span>
                <span className="text-charcoal-900 font-semibold">
                  {frequencyLabels[event.frequencyType] ??
                    event.frequencyType}
                  {event.frequencyCount > 1 &&
                    ` (${event.frequencyCount} sessions)`}
                </span>
              </div>
              <div className="rounded-xl bg-cream-50 p-4">
                <span className="text-charcoal-400 text-xs font-medium uppercase tracking-wider block mb-1">
                  Spots
                </span>
                <span className="text-charcoal-900 font-semibold">
                  {spotsRemaining !== null
                    ? `${spotsRemaining} of ${event.capacity} remaining`
                    : "Unlimited"}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-primary-50 border border-primary-200 text-primary-700 rounded-xl px-4 py-3 text-sm mb-6">
                {error}
              </div>
            )}

            {/* Actions */}
            {event.status === "published" && (
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
      </div>

      {/* Schedule */}
      {event.occurrences.length > 0 && (
        <div className="mt-8">
          <p className="text-primary-500 font-bold text-[11px] tracking-[0.2em] uppercase mb-2">
            Schedule
          </p>
          <h2 className="text-lg font-bold text-charcoal-900 mb-4">
            Session dates
          </h2>
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
                  Session {i + 1}: {formatDateTime(occ.startTime)}
                </span>
                <span className="text-charcoal-400">
                  {formatDateTime(occ.endTime).split(",").pop()?.trim()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
