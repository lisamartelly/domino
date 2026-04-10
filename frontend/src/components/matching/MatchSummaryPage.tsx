import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useMatchFlow } from "../../contexts/MatchFlowContext";
import {
  getActivityIdeas,
  createMatch,
  type ActivityIdeaDto,
} from "../../services/api";
import type { MatchMember } from "../../types/matching";

const compareRows: { key: keyof MatchMember; label: string }[] = [
  { key: "age", label: "Age" },
];

function formatCell(m: MatchMember, key: keyof MatchMember): string {
  const v = m[key];
  if (v === undefined || v === null) return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function MatchSummaryPage() {
  const navigate = useNavigate();
  const {
    slot0,
    slot1,
    narrative,
    setNarrative,
    selectedActivityIdeaIds,
    setSelectedActivityIdeaIds,
    resetPair,
  } = useMatchFlow();

  const [activityIdeas, setActivityIdeas] = useState<ActivityIdeaDto[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActivityIdeas()
      .then((data) => {
        if (!cancelled) setActivityIdeas(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load activity ideas");
      })
      .finally(() => {
        if (!cancelled) setLoadingIdeas(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!slot0 || !slot1) {
    return <Navigate to="/match" replace />;
  }

  const toggleIdea = (id: number) => {
    if (selectedActivityIdeaIds.includes(id)) {
      setSelectedActivityIdeaIds(
        selectedActivityIdeaIds.filter((i) => i !== id)
      );
    } else if (selectedActivityIdeaIds.length < 3) {
      setSelectedActivityIdeaIds([...selectedActivityIdeaIds, id]);
    }
  };

  const canSend =
    narrative.trim().length > 0 && selectedActivityIdeaIds.length === 3;

  const handleSend = async () => {
    if (!canSend || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await createMatch({
        userId1: slot0.id,
        userId2: slot1.id,
        narrative: narrative.trim(),
        activityIdeaIds: selectedActivityIdeaIds,
      });
      resetPair();
      navigate("/match");
    } catch (err: any) {
      setError(err.message || "Failed to create match");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          to="/match"
          className="inline-block text-sm text-primary-400 hover:text-primary-300"
        >
          ← Edit selection
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-cream-50">
          Match summary
        </h1>

        {/* Side-by-side cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {[slot0, slot1].map((m) => (
            <div
              key={m.id}
              className="bg-cream-50 rounded-2xl border border-charcoal-200 shadow-xl overflow-hidden flex flex-col"
            >
              <div className="p-6 flex flex-col items-center bg-white border-b border-charcoal-200">
                <div className="w-24 h-24 rounded-full bg-charcoal-200 flex items-center justify-center text-4xl text-charcoal-500 mb-3">
                  👤
                </div>
                <h2 className="text-lg font-bold text-charcoal-900 text-center">
                  {m.name}
                </h2>
              </div>
              <div className="p-4 space-y-3 flex-1">
                {compareRows.map((row) => (
                  <div
                    key={row.key}
                    className="text-sm border-b border-charcoal-100 pb-3 last:border-0"
                  >
                    <p className="text-xs font-semibold uppercase text-charcoal-500">
                      {row.label}
                    </p>
                    <p className="text-charcoal-800 mt-1">
                      {formatCell(m, row.key)}
                    </p>
                  </div>
                ))}
                <div className="text-sm">
                  <p className="text-xs font-semibold uppercase text-charcoal-500">
                    Match stats
                  </p>
                  <p className="text-charcoal-800 mt-1">
                    {m.matchStats.totalMatches} total ·{" "}
                    {m.matchStats.accepted} accepted ·{" "}
                    {m.matchStats.denied} denied
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Narrative */}
        <section className="bg-cream-50 rounded-2xl border border-charcoal-200 p-4 md:p-6 shadow-lg">
          <h3 className="text-sm font-semibold uppercase text-charcoal-500 mb-3">
            Narrative
          </h3>
          <p className="text-xs text-charcoal-500 mb-2">
            Write why these two are a good match. This is shown to both users.
          </p>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="e.g. You both love outdoor activities and are in the same area..."
            className="w-full rounded-lg border border-charcoal-300 p-3 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
          />
          <p className="text-xs text-charcoal-400 mt-1 text-right">
            {narrative.length}/1000
          </p>
        </section>

        {/* Activity idea picker */}
        <section className="bg-cream-50 rounded-2xl border border-charcoal-200 p-4 md:p-6 shadow-lg">
          <h3 className="text-sm font-semibold uppercase text-charcoal-500 mb-1">
            Activity ideas
          </h3>
          <p className="text-xs text-charcoal-500 mb-4">
            Pick exactly 3 date ideas. These are revealed after both users
            accept.
          </p>

          {loadingIdeas ? (
            <p className="text-sm text-charcoal-500">Loading ideas...</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {activityIdeas.map((idea) => {
                const selected = selectedActivityIdeaIds.includes(idea.id);
                const disabled =
                  !selected && selectedActivityIdeaIds.length >= 3;
                return (
                  <button
                    key={idea.id}
                    type="button"
                    onClick={() => toggleIdea(idea.id)}
                    disabled={disabled}
                    className={`text-left p-3 rounded-lg border-2 transition-all ${
                      selected
                        ? "border-primary-500 bg-primary-50 ring-1 ring-primary-300"
                        : disabled
                          ? "border-charcoal-200 bg-charcoal-50 opacity-50 cursor-not-allowed"
                          : "border-charcoal-200 bg-white hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer"
                    }`}
                  >
                    <p className="font-medium text-sm text-charcoal-900">
                      {idea.name}
                    </p>
                    <p className="text-xs text-charcoal-500 mt-1">
                      {idea.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          <p className="text-xs text-charcoal-400 mt-3">
            {selectedActivityIdeaIds.length}/3 selected
          </p>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || submitting}
            className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {submitting ? "Sending..." : "Send match"}
          </button>
          <button
            type="button"
            onClick={() => {
              resetPair();
              navigate("/match");
            }}
            className="flex-1 bg-white border-2 border-charcoal-300 text-charcoal-900 font-semibold py-3 px-4 rounded-lg hover:bg-charcoal-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
