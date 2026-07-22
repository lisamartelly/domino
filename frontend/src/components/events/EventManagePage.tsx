import { useEffect, useState } from "react";
import {
  getAllEvents,
  createEvent,
  publishEvent,
  cancelEvent,
  type EventSummaryDto,
  type CreateEventRequest,
} from "../../services/api";

function formatCost(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const frequencyLabels: Record<string, string> = {
  ONCE: "One-time",
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Monthly",
};

const statusColors: Record<string, string> = {
  draft: "bg-charcoal-100 text-charcoal-600",
  published: "bg-accent2-100 text-accent2-700",
  cancelled: "bg-primary-100 text-primary-700",
};

const emptyForm: CreateEventRequest = {
  name: "",
  description: "",
  location: "",
  costCents: 0,
  durationMinutes: 60,
  startTime: "",
  frequencyType: "ONCE",
  frequencyCount: 1,
};

export function EventManagePage() {
  const [events, setEvents] = useState<EventSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateEventRequest & { capacity?: number }>(
    { ...emptyForm }
  );

  const loadEvents = () => {
    setLoading(true);
    getAllEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const resetForm = () => {
    setFormOpen(false);
    setForm({ ...emptyForm });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createEvent({
        name: form.name,
        description: form.description,
        location: form.location,
        costCents: form.costCents,
        capacity: form.capacity || undefined,
        startTime: new Date(form.startTime).toISOString(),
        durationMinutes: form.durationMinutes,
        frequencyType: form.frequencyType,
        frequencyCount:
          form.frequencyType === "ONCE" ? 1 : form.frequencyCount ?? 1,
      });
      resetForm();
      loadEvents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id: number) => {
    try {
      await publishEvent(id);
      loadEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Cancel this event? This cannot be undone.")) return;
    try {
      await cancelEvent(id);
      loadEvents();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-charcoal-900">
          Manage Events
        </h1>
        {!formOpen && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setFormOpen(true);
            }}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            + New Event
          </button>
        )}
      </header>

      {error && (
        <div className="bg-primary-50 border border-primary-200 text-primary-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-charcoal-200 bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-semibold text-charcoal-900">
            New Event
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={255}
                required
                className="w-full rounded-lg border border-charcoal-200 p-2.5 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-accent1-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                maxLength={2000}
                rows={3}
                required
                className="w-full rounded-lg border border-charcoal-200 p-2.5 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-accent1-500 resize-y"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Location
              </label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                maxLength={500}
                required
                className="w-full rounded-lg border border-charcoal-200 p-2.5 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-accent1-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Cost ($)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.costCents / 100}
                onChange={(e) =>
                  setForm({
                    ...form,
                    costCents: Math.round(parseFloat(e.target.value || "0") * 100),
                  })
                }
                required
                className="w-full rounded-lg border border-charcoal-200 p-2.5 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-accent1-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                required
                className="w-full rounded-lg border border-charcoal-200 p-2.5 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-accent1-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationMinutes: parseInt(e.target.value || "60", 10),
                  })
                }
                required
                className="w-full rounded-lg border border-charcoal-200 p-2.5 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-accent1-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Frequency
              </label>
              <select
                value={form.frequencyType}
                onChange={(e) =>
                  setForm({ ...form, frequencyType: e.target.value })
                }
                className="w-full rounded-lg border border-charcoal-200 p-2.5 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-accent1-500"
              >
                <option value="ONCE">One-time</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Every 2 weeks</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            {form.frequencyType !== "ONCE" && (
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Number of Sessions
                </label>
                <input
                  type="number"
                  min={2}
                  value={form.frequencyCount ?? 2}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      frequencyCount: parseInt(e.target.value || "2", 10),
                    })
                  }
                  required
                  className="w-full rounded-lg border border-charcoal-200 p-2.5 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-accent1-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Capacity (leave empty for unlimited)
              </label>
              <input
                type="number"
                min={1}
                value={form.capacity ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    capacity: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
                className="w-full rounded-lg border border-charcoal-200 p-2.5 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-accent1-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {saving ? "Creating..." : "Create Event"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-white border border-charcoal-200 text-charcoal-700 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-charcoal-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-charcoal-400 text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-charcoal-200 bg-white p-4 shadow-sm border-l-4 border-l-accent2-400"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-charcoal-900 truncate">
                      {event.name}
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                        statusColors[event.status] ?? statusColors.draft
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="text-sm text-charcoal-500 mt-1">
                    {formatDate(event.startTime)} &middot; {event.location}{" "}
                    &middot; {formatCost(event.costCents)}
                    {event.frequencyType !== "ONCE" &&
                      ` \u00B7 ${
                        frequencyLabels[event.frequencyType]
                      } (${event.frequencyCount}x)`}
                  </p>
                  <p className="text-xs text-charcoal-400 mt-1">
                    {event.registrationCount} registered
                    {event.capacity !== null && ` / ${event.capacity} capacity`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {event.status === "draft" && (
                    <button
                      type="button"
                      onClick={() => handlePublish(event.id)}
                      className="text-xs text-accent2-600 hover:text-accent2-700 underline"
                    >
                      Publish
                    </button>
                  )}
                  {event.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => handleCancel(event.id)}
                      className="text-xs text-primary-700 hover:text-primary-800 underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-charcoal-400 text-center py-8">
              No events yet. Create one above.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
