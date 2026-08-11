import { useEffect, useState, useCallback, useRef } from "react";
import {
  getAllEvents,
  createEvent,
  updateEvent,
  publishEvent,
  unpublishEvent,
  cancelEvent,
  setEventFeatured,
  getFeaturedEventsAdmin,
  reorderFeaturedEvents,
  getEventInterests,
  type EventSummaryDto,
  type EventInterestDto,
  type CreateEventRequest,
  type UpdateEventRequest,
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

const emptyForm: CreateEventRequest & { phase: string } = {
  name: "",
  description: "",
  location: "",
  costCents: 0,
  durationMinutes: 60,
  startTime: "",
  frequencyType: "ONCE",
  frequencyCount: 1,
  phase: "scheduled",
  anticipatedPriceRange: "",
};

function EventInterestPanel({ eventId }: { eventId: number }) {
  const [interests, setInterests] = useState<EventInterestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getEventInterests(eventId)
      .then(setInterests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleCopy = async () => {
    const emails = interests.map((i) => i.email).join("\n");
    await navigator.clipboard.writeText(emails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="text-charcoal-400 text-sm py-4 text-center">Loading interests...</div>;
  }

  if (error) {
    return <div className="text-primary-700 text-sm py-2">{error}</div>;
  }

  if (interests.length === 0) {
    return <div className="text-charcoal-400 text-sm py-4 text-center">No one has expressed interest yet.</div>;
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-charcoal-700">
          {interests.length} interested
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy emails
            </>
          )}
        </button>
      </div>
      <div className="rounded-xl border border-charcoal-100 bg-charcoal-50/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal-100">
              <th className="text-left font-semibold text-charcoal-600 px-4 py-2">Name</th>
              <th className="text-left font-semibold text-charcoal-600 px-4 py-2">Email</th>
              <th className="text-left font-semibold text-charcoal-600 px-4 py-2">Open to Romance</th>
              <th className="text-left font-semibold text-charcoal-600 px-4 py-2">About</th>
              <th className="text-left font-semibold text-charcoal-600 px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {interests.map((interest) => (
              <tr key={interest.id} className="border-b border-charcoal-100 last:border-b-0">
                <td className="px-4 py-2 text-charcoal-900">{interest.name || "—"}</td>
                <td className="px-4 py-2 text-charcoal-900">{interest.email}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    interest.openToRomance
                      ? "bg-accent2-100 text-accent2-700"
                      : "bg-charcoal-100 text-charcoal-500"
                  }`}>
                    {interest.openToRomance ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-2 text-charcoal-600 max-w-[200px] truncate" title={interest.aboutMe}>
                  {interest.aboutMe}
                </td>
                <td className="px-4 py-2 text-charcoal-500 whitespace-nowrap">
                  {new Date(interest.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EventManagePage() {
  const [events, setEvents] = useState<EventSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedInterests, setExpandedInterests] = useState<Set<number>>(new Set());
  const [form, setForm] = useState<CreateEventRequest & { capacity?: number; phase: string }>(
    { ...emptyForm }
  );
  const [featuredOrder, setFeaturedOrder] = useState<EventSummaryDto[]>([]);
  const [featuredOrderOpen, setFeaturedOrderOpen] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const toggleInterests = (eventId: number) => {
    setExpandedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const loadEvents = () => {
    setLoading(true);
    getAllEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const loadFeaturedOrder = useCallback(() => {
    getFeaturedEventsAdmin()
      .then(setFeaturedOrder)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadEvents();
    loadFeaturedOrder();
  }, [loadFeaturedOrder]);

  const resetForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError(null);
  };

  const handleEdit = (event: EventSummaryDto) => {
    setEditingId(event.id);
    setForm({
      name: event.name,
      description: event.description,
      location: event.location,
      costCents: event.costCents,
      capacity: event.capacity ?? undefined,
      startTime: event.startTime
        ? new Date(event.startTime).toISOString().slice(0, 16)
        : "",
      durationMinutes: event.durationMinutes,
      frequencyType: event.frequencyType,
      frequencyCount: event.frequencyCount,
      phase: event.phase,
      anticipatedPriceRange: event.anticipatedPriceRange ?? "",
    });
    setFormOpen(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const isGathering = form.phase === "gathering";

      if (editingId !== null) {
        const payload: UpdateEventRequest = {
          name: form.name,
          description: form.description,
          location: form.location,
          costCents: form.costCents,
          capacity: form.capacity || null,
          startTime: isGathering ? undefined : form.startTime ? new Date(form.startTime).toISOString() : undefined,
          durationMinutes: form.durationMinutes,
          frequencyType: form.frequencyType,
          frequencyCount: form.frequencyType === "ONCE" ? 1 : form.frequencyCount ?? 1,
          phase: form.phase,
          anticipatedPriceRange: form.anticipatedPriceRange || undefined,
        };
        await updateEvent(editingId, payload);
      } else {
        await createEvent({
          name: form.name,
          description: form.description,
          location: form.location,
          costCents: form.costCents,
          capacity: form.capacity || undefined,
          startTime: isGathering ? undefined : new Date(form.startTime!).toISOString(),
          durationMinutes: form.durationMinutes,
          frequencyType: form.frequencyType,
          frequencyCount: form.frequencyType === "ONCE" ? 1 : form.frequencyCount ?? 1,
          phase: form.phase,
          anticipatedPriceRange: form.anticipatedPriceRange || undefined,
        });
      }
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

  const handleUnpublish = async (id: number) => {
    try {
      await unpublishEvent(id);
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

  const handleToggleFeatured = async (id: number, currentlyFeatured: boolean) => {
    try {
      await setEventFeatured(id, !currentlyFeatured);
      loadEvents();
      loadFeaturedOrder();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIdx.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIdx(index);
  };

  const handleDrop = (index: number) => {
    if (dragIdx.current === null || dragIdx.current === index) {
      dragIdx.current = null;
      setDragOverIdx(null);
      return;
    }
    const newOrder = [...featuredOrder];
    const [moved] = newOrder.splice(dragIdx.current, 1);
    newOrder.splice(index, 0, moved);
    setFeaturedOrder(newOrder);
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const handleSaveFeaturedOrder = async () => {
    setSavingOrder(true);
    try {
      await reorderFeaturedEvents(featuredOrder.map((e) => e.id));
      loadFeaturedOrder();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingOrder(false);
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

      {featuredOrder.length > 0 && (
        <div className="rounded-2xl border border-accent1-200 bg-accent1-50/30 shadow-sm">
          <button
            type="button"
            onClick={() => setFeaturedOrderOpen(!featuredOrderOpen)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <span className="font-semibold text-charcoal-900">
              ★ Featured Events Order ({featuredOrder.length})
            </span>
            <svg
              className={`w-5 h-5 text-charcoal-400 transition-transform ${featuredOrderOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {featuredOrderOpen && (
            <div className="px-4 pb-4 space-y-1">
              {featuredOrder.map((event, index) => (
                <div
                  key={event.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-2.5 cursor-grab active:cursor-grabbing transition-all ${
                    dragOverIdx === index
                      ? "border-accent1-400 shadow-md ring-1 ring-accent1-300"
                      : "border-charcoal-200"
                  } ${
                    dragIdx.current === index ? "opacity-50" : ""
                  }`}
                >
                  <svg className="w-4 h-4 text-charcoal-300 shrink-0" fill="currentColor" viewBox="0 0 16 16">
                    <circle cx="5" cy="3" r="1.5" />
                    <circle cx="11" cy="3" r="1.5" />
                    <circle cx="5" cy="8" r="1.5" />
                    <circle cx="11" cy="8" r="1.5" />
                    <circle cx="5" cy="13" r="1.5" />
                    <circle cx="11" cy="13" r="1.5" />
                  </svg>
                  <span className="text-sm font-medium text-charcoal-400 w-6 text-center">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-charcoal-900 truncate">
                    {event.name}
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={handleSaveFeaturedOrder}
                disabled={savingOrder}
                className="mt-3 bg-accent1-500 hover:bg-accent1-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
              >
                {savingOrder ? "Saving..." : "Save Order"}
              </button>
            </div>
          )}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-charcoal-200 bg-white p-6 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-semibold text-charcoal-900">
            {editingId !== null ? "Edit Event" : "New Event"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-charcoal-700 mb-1">
                Event Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="phase"
                    checked={form.phase === "scheduled"}
                    onChange={() => setForm({ ...form, phase: "scheduled" })}
                    className="w-4 h-4 accent-accent1-500"
                  />
                  <span className="text-sm text-charcoal-700">Scheduled (has a date)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="phase"
                    checked={form.phase === "gathering"}
                    onChange={() => setForm({ ...form, phase: "gathering" })}
                    className="w-4 h-4 accent-accent1-500"
                  />
                  <span className="text-sm text-charcoal-700">Gathering interest (no date yet)</span>
                </label>
              </div>
            </div>

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

            {form.phase === "gathering" && (
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1">
                  Anticipated Price Range
                </label>
                <input
                  value={form.anticipatedPriceRange || ""}
                  onChange={(e) =>
                    setForm({ ...form, anticipatedPriceRange: e.target.value })
                  }
                  maxLength={100}
                  placeholder='e.g. "$20-$40", "Free", "~$15"'
                  className="w-full rounded-lg border border-charcoal-200 p-2.5 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-accent1-500"
                />
              </div>
            )}

            {form.phase === "scheduled" && (
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
            )}

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
              {saving
                ? editingId !== null ? "Saving..." : "Creating..."
                : editingId !== null ? "Save Changes" : "Create Event"}
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
                    {event.startTime ? formatDate(event.startTime) : "TBD"} &middot; {event.location}{" "}
                    &middot; {formatCost(event.costCents)}
                    {event.frequencyType !== "ONCE" &&
                      ` \u00B7 ${
                        frequencyLabels[event.frequencyType]
                      } (${event.frequencyCount}x)`}
                  </p>
                  <p className="text-xs text-charcoal-400 mt-1">
                    {event.phase === "gathering" ? (
                      <>{event.interestCount} interested</>
                    ) : (
                      <>
                        {event.registrationCount} registered
                        {event.capacity !== null && ` / ${event.capacity} capacity`}
                      </>
                    )}
                    {event.phase === "gathering" && (
                      <span className="ml-2 text-accent1-600 font-medium">
                        · Gathering Interest
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 items-center flex-wrap justify-end">
                  {event.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => handleEdit(event)}
                      className="text-xs font-medium px-2 py-1 rounded-lg bg-charcoal-50 text-charcoal-600 hover:bg-charcoal-100 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  {event.status === "published" && (
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(event.id, event.isFeatured)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                        event.isFeatured
                          ? "bg-accent1-100 text-accent1-700 hover:bg-accent1-200"
                          : "bg-charcoal-50 text-charcoal-500 hover:bg-charcoal-100"
                      }`}
                      title={event.isFeatured ? "Remove from homepage" : "Feature on homepage"}
                    >
                      {event.isFeatured ? "★ Featured" : "☆ Feature"}
                    </button>
                  )}
                  {event.status === "draft" && (
                    <button
                      type="button"
                      onClick={() => handlePublish(event.id)}
                      className="text-xs text-accent2-600 hover:text-accent2-700 underline"
                    >
                      Publish
                    </button>
                  )}
                  {event.status === "published" && (
                    <button
                      type="button"
                      onClick={() => handleUnpublish(event.id)}
                      className="text-xs text-charcoal-500 hover:text-charcoal-700 underline"
                    >
                      Unpublish
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
                  {event.interestCount > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleInterests(event.id)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                        expandedInterests.has(event.id)
                          ? "bg-accent2-100 text-accent2-700"
                          : "bg-charcoal-50 text-charcoal-600 hover:bg-charcoal-100"
                      }`}
                    >
                      {expandedInterests.has(event.id) ? "Hide Interests" : `View Interests (${event.interestCount})`}
                    </button>
                  )}
                </div>
              </div>
              {expandedInterests.has(event.id) && (
                <EventInterestPanel eventId={event.id} />
              )}
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
