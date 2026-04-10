import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getMatch,
  respondToMatch,
  type MatchDetailDto,
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export function MatchViewPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);

  const load = useCallback(() => {
    if (!publicId) return;
    setLoading(true);
    getMatch(publicId)
      .then(setMatch)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [publicId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRespond = async (accepted: boolean) => {
    if (!publicId || responding) return;
    setResponding(true);
    setError(null);
    try {
      await respondToMatch(publicId, accepted);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center">
        <div className="text-cream-50 text-lg">Loading...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4">
        <div className="text-cream-50 text-center">
          <p className="mb-4">{error || "Match not found."}</p>
          <Link to="/dashboard" className="text-primary-400 hover:underline">
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentUserId = user ? parseInt(user.id, 10) : -1;
  const isParticipant = match.users.some((u) => u.userId === currentUserId);
  const currentMatchUser = match.users.find(
    (u) => u.userId === currentUserId
  );

  const expiresAt = new Date(
    new Date(match.createdAt).getTime() + 24 * 60 * 60 * 1000
  );
  const timeLeft = expiresAt.getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const minutesLeft = Math.max(
    0,
    Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          to="/dashboard"
          className="inline-block text-sm text-primary-400 hover:text-primary-300"
        >
          ← Dashboard
        </Link>

        {/* Status banner */}
        {match.isExpired && !match.bothAccepted && (
          <div className="bg-charcoal-700 border border-charcoal-600 text-charcoal-300 rounded-xl px-5 py-4 text-center">
            <p className="font-semibold text-lg">This match has expired</p>
            <p className="text-sm mt-1">
              The 24-hour window to respond has passed.
            </p>
          </div>
        )}

        {match.bothAccepted && (
          <div className="bg-green-900/30 border border-green-700 text-green-300 rounded-xl px-5 py-4 text-center">
            <p className="font-semibold text-lg">It's a match!</p>
            <p className="text-sm mt-1">
              You both accepted. Check out your date ideas below.
            </p>
          </div>
        )}

        {!match.isExpired && !match.bothAccepted && (
          <div className="bg-charcoal-800 border border-charcoal-600 text-charcoal-300 rounded-xl px-5 py-4 text-center">
            <p className="text-sm">
              {hoursLeft}h {minutesLeft}m left to respond
            </p>
          </div>
        )}

        {/* Narrative */}
        <section className="bg-cream-50 rounded-2xl border border-charcoal-200 p-6 shadow-xl">
          <h2 className="text-sm font-semibold uppercase text-charcoal-500 mb-3">
            Why you were matched
          </h2>
          <p className="text-charcoal-800 leading-relaxed">
            {match.narrative}
          </p>
        </section>

        {/* Users */}
        <div className="grid md:grid-cols-2 gap-4">
          {match.users.map((mu) => {
            const isMe = mu.userId === currentUserId;
            return (
              <div
                key={mu.userId}
                className={`bg-cream-50 rounded-2xl border shadow-lg p-5 flex flex-col items-center text-center ${
                  isMe
                    ? "border-primary-300 ring-1 ring-primary-200"
                    : "border-charcoal-200"
                }`}
              >
                <div className="w-20 h-20 rounded-full bg-charcoal-200 flex items-center justify-center text-3xl text-charcoal-500 mb-3">
                  👤
                </div>
                <p className="font-bold text-charcoal-900">
                  {mu.firstName} {mu.lastInitial}
                </p>
                <p className="text-sm text-charcoal-600">Age {mu.age}</p>
                {isMe && (
                  <span className="text-xs bg-primary-100 text-primary-700 rounded-full px-2 py-0.5 mt-2">
                    You
                  </span>
                )}
                <div className="mt-3">
                  {mu.accepted === true && (
                    <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                      Accepted
                    </span>
                  )}
                  {mu.accepted === false && (
                    <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">
                      Denied
                    </span>
                  )}
                  {mu.accepted === null && !match.isExpired && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5">
                      Pending
                    </span>
                  )}
                  {mu.accepted === null && match.isExpired && (
                    <span className="text-xs bg-charcoal-100 text-charcoal-500 rounded-full px-2 py-0.5">
                      No response
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Accept / Deny buttons */}
        {isParticipant &&
          currentMatchUser?.accepted === null &&
          !match.isExpired && (
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => handleRespond(true)}
                disabled={responding}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {responding ? "..." : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => handleRespond(false)}
                disabled={responding}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {responding ? "..." : "Deny"}
              </button>
            </div>
          )}

        {/* Activity ideas (revealed after both accept) */}
        {match.bothAccepted && match.activityIdeas.length > 0 && (
          <section className="bg-cream-50 rounded-2xl border border-charcoal-200 p-6 shadow-xl">
            <h2 className="text-sm font-semibold uppercase text-charcoal-500 mb-4">
              Date ideas for you
            </h2>
            <div className="space-y-3">
              {match.activityIdeas.map((idea, i) => (
                <div
                  key={idea.id}
                  className="bg-white rounded-xl border border-charcoal-100 p-4"
                >
                  <p className="font-semibold text-charcoal-900">
                    {i + 1}. {idea.name}
                  </p>
                  <p className="text-sm text-charcoal-600 mt-1">
                    {idea.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
