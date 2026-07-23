import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getMatch,
  respondToMatch,
  type MatchDetailDto,
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { getAvatarUrl } from "../../utils/avatar";

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
      <div className="flex items-center justify-center py-32">
        <div className="text-charcoal-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-charcoal-500 text-center">
          <p className="mb-4 text-lg">{error || "Match not found."}</p>
          <Link
            to="/dashboard"
            className="text-sm text-primary-500 hover:text-primary-600 underline underline-offset-4"
          >
            ← Back to dashboard
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
  const otherUser = match.users.find((u) => u.userId !== currentUserId);

  const expiresAt = new Date(
    new Date(match.createdAt).getTime() + 24 * 60 * 60 * 1000
  );
  const timeLeft = expiresAt.getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const minutesLeft = Math.max(
    0,
    Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  );

  const canRespond =
    isParticipant && currentMatchUser?.accepted === null && !match.isExpired;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Timer / Status bar */}
        <div className="text-center mb-6">
          {match.isExpired && !match.bothAccepted && (
            <span className="text-sm text-charcoal-400">
              This match has expired
            </span>
          )}
          {match.bothAccepted && (
            <span className="text-sm text-accent1-800 font-semibold">
              🎉 It's a match!
            </span>
          )}
          {!match.isExpired && !match.bothAccepted && (
            <span className="text-sm text-charcoal-400">
              <strong className="text-accent1-500 font-semibold">
                {hoursLeft}h {minutesLeft}m
              </strong>{" "}
              remaining to respond
            </span>
          )}
        </div>

        {/* Spotlight Card */}
        <div className="relative">
          {/* Gradient border glow */}
          <div className="absolute -inset-[2px] rounded-[30px] bg-gradient-to-br from-primary-400 via-accent1-400 to-primary-400 opacity-30" />

          <div className="relative bg-white rounded-[28px] shadow-sm border border-charcoal-200 px-8 py-10 md:px-10 md:py-12 text-center">
            {/* Label */}
            <p className="text-primary-500 font-bold text-[11px] tracking-[0.2em] uppercase mb-7">
              {match.bothAccepted
                ? "Matched"
                : match.isExpired
                ? "Expired"
                : "Your Match"}
            </p>

            {/* Avatar */}
            {otherUser && (
              <>
                <img
                  src={getAvatarUrl(otherUser.userId)}
                  alt={`${otherUser.firstName} ${otherUser.lastInitial}`}
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-5 ring-2 ring-accent2-200 ring-offset-2"
                />
                <h1 className="text-3xl font-bold text-charcoal-900">
                  Meet {otherUser.firstName} {otherUser.lastInitial}.
                </h1>
                <p className="text-charcoal-400 text-[15px] mt-1">
                  Age {otherUser.age}
                </p>
              </>
            )}

            {/* Narrative */}
            <p className="italic text-charcoal-500 text-base leading-relaxed max-w-sm mx-auto mt-7 mb-8">
              <span className="not-italic text-primary-400 text-2xl leading-none align-[-4px] mr-0.5">
                "
              </span>
              {match.narrative}
              <span className="not-italic text-primary-400 text-2xl leading-none align-[-4px] ml-0.5">
                "
              </span>
            </p>

            {/* Accept / Deny */}
            {canRespond && (
              <div className="flex gap-3 justify-center max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => handleRespond(true)}
                  disabled={responding}
                  className="flex-1 bg-accent1-500 hover:bg-accent1-600 disabled:opacity-50 text-charcoal-900 font-bold py-3.5 px-6 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent1-500/25"
                >
                  {responding ? "..." : "Accept"}
                </button>
                <button
                  type="button"
                  onClick={() => handleRespond(false)}
                  disabled={responding}
                  className="flex-1 border border-charcoal-200 hover:border-charcoal-400 disabled:opacity-50 text-charcoal-400 hover:text-charcoal-500 font-medium py-3.5 px-6 rounded-xl transition-all"
                >
                  {responding ? "..." : "Decline"}
                </button>
              </div>
            )}

            {/* Status badges when not actionable */}
            {!canRespond && (
              <div className="flex justify-center gap-4 mt-2">
                {match.users.map((mu) => {
                  const isMe = mu.userId === currentUserId;
                  return (
                    <div key={mu.userId} className="text-center">
                      <p className="text-xs text-charcoal-400 mb-1">
                        {isMe ? "You" : `${mu.firstName}`}
                      </p>
                      {mu.accepted === true && (
                        <span className="text-xs bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 font-semibold">
                          Accepted
                        </span>
                      )}
                      {mu.accepted === false && (
                        <span className="text-xs bg-primary-100 text-primary-800 rounded-full px-2.5 py-0.5 font-semibold">
                          Denied
                        </span>
                      )}
                      {mu.accepted === null && (
                        <span className="text-xs bg-charcoal-100 text-charcoal-500 rounded-full px-2.5 py-0.5 font-semibold">
                          {match.isExpired ? "No response" : "Pending"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Activity Ideas — revealed after both accept */}
        {match.bothAccepted && match.activityIdeas.length > 0 && (
          <div className="mt-8">
            <p className="text-primary-500 font-bold text-[11px] tracking-[0.2em] uppercase mb-2 text-center">
              Date Ideas
            </p>
            <h2 className="text-lg font-bold text-charcoal-900 mb-4 text-center">
              Here are some ideas for you two
            </h2>
            <div className="space-y-3">
              {match.activityIdeas.map((idea, i) => (
                <div
                  key={idea.id}
                  className="rounded-xl border border-charcoal-200 border-l-4 border-l-accent2-400 bg-white p-5"
                >
                  <p className="font-semibold text-charcoal-900">
                    {i + 1}. {idea.name}
                  </p>
                  <p className="text-sm text-charcoal-500 mt-1 leading-relaxed">
                    {idea.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 bg-primary-50 border border-primary-200 text-primary-700 rounded-xl px-4 py-3 text-sm text-center">
            {error}
          </div>
        )}

        {/* Subtle nav */}
        <div className="text-center mt-8">
          <Link
            to="/dashboard"
            className="text-sm text-charcoal-400 hover:text-primary-500 transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
