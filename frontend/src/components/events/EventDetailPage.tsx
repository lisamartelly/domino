import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
      <div className="text-charcoal-400 text-center py-12">
        Loading event...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-charcoal-400 text-center py-12">
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
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate("/events")}
        className="text-sm text-primary-600 hover:text-primary-700 underline"
      >
        &larr; Back to Events
      </button>

      <div className="rounded-2xl border border-charcoal-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-900">
              {event.name}
            </h1>
            <span
              className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                event.status === "published"
                  ? "bg-accent2-100 text-accent2-700"
                  : event.status === "cancelled"
                  ? "bg-primary-100 text-primary-700"
                  : "bg-charcoal-100 text-charcoal-600"
              }`}
            >
              {event.status}
            </span>
          </div>
          <span
            className={`text-xl font-bold ${
              event.costCents === 0 ? "text-accent2-600" : "text-charcoal-900"
            }`}
          >
            {formatCost(event.costCents)}
          </span>
        </div>

        <p className="text-charcoal-600 mt-4">{event.description}</p>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-charcoal-400 block">Location</span>
            <span className="text-charcoal-900 font-medium">
              {event.location}
            </span>
          </div>
          <div>
            <span className="text-charcoal-400 block">Duration</span>
            <span className="text-charcoal-900 font-medium">
              {event.durationMinutes} min
            </span>
          </div>
          <div>
            <span className="text-charcoal-400 block">Schedule</span>
            <span className="text-charcoal-900 font-medium">
              {frequencyLabels[event.frequencyType] ?? event.frequencyType}
              {event.frequencyCount > 1 &&
                ` (${event.frequencyCount} sessions)`}
            </span>
          </div>
          <div>
            <span className="text-charcoal-400 block">Spots</span>
            <span className="text-charcoal-900 font-medium">
              {spotsRemaining !== null
                ? `${spotsRemaining} of ${event.capacity} remaining`
                : "Unlimited"}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-primary-50 border border-primary-200 text-primary-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {event.status === "published" && (
          <div className="mt-6">
            {isRegistered ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-accent2-700 font-medium bg-accent2-50 px-3 py-1.5 rounded-lg">
                  Registered ({myReg!.status})
                </span>
                <button
                  type="button"
                  onClick={handleCancelRegistration}
                  disabled={actionLoading}
                  className="text-sm text-primary-600 hover:text-primary-700 underline disabled:opacity-50"
                >
                  {actionLoading ? "Cancelling..." : "Cancel registration"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRegister}
                disabled={actionLoading || isFull}
                className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
              >
                {actionLoading
                  ? "Processing..."
                  : isFull
                  ? "Event Full"
                  : !isAuthenticated
                  ? "Sign up to register"
                  : event.costCents === 0
                  ? "Register"
                  : `Register - ${formatCost(event.costCents)}`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Schedule */}
      {event.occurrences.length > 0 && (
        <div className="rounded-2xl border border-charcoal-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-charcoal-900 mb-4">
            Schedule
          </h2>
          <div className="space-y-2">
            {event.occurrences.map((occ, i) => (
              <div
                key={occ.id}
                className={`flex items-center justify-between text-sm py-2 px-3 rounded-lg ${
                  occ.isCancelled
                    ? "bg-charcoal-50 text-charcoal-400 line-through"
                    : "bg-charcoal-50 text-charcoal-700"
                }`}
              >
                <span>
                  Session {i + 1}: {formatDateTime(occ.startTime)}
                </span>
                <span>
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
