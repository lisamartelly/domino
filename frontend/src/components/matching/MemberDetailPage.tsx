import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getMemberDetail, type MemberDetailDto } from "../../services/api";
import { useMatchFlow } from "../../contexts/MatchFlowContext";
import { toMatchMember } from "../../types/matching";

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToMatch } = useMatchFlow();
  const [notice, setNotice] = useState<string | null>(null);
  const [member, setMember] = useState<MemberDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getMemberDetail(parseInt(id, 10))
      .then((data) => {
        if (!cancelled) setMember(data);
      })
      .catch(() => {
        if (!cancelled) setMember(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center">
        <div className="text-cream-50">Loading...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center p-4">
        <div className="text-cream-50 text-center">
          <p className="mb-4">Member not found.</p>
          <Link to="/match" className="text-primary-400 hover:underline">
            Back to table
          </Link>
        </div>
      </div>
    );
  }

  const displayName = `${member.firstName} ${member.lastName}`;
  const matchMember = toMatchMember(member);

  const handleAddToMatch = () => {
    setNotice(null);
    const result = addToMatch(matchMember);
    if (result === "duplicate") {
      setNotice("This person is already in a match slot.");
      return;
    }
    if (result === "full") {
      setNotice(
        "Both slots are full. Remove someone from the match page first."
      );
      return;
    }
    if (result === "complete") {
      navigate("/match/summary");
      return;
    }
    navigate("/match");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/match"
          className="inline-block text-sm text-primary-400 hover:text-primary-300 mb-6"
        >
          ← Back to table
        </Link>

        <div className="bg-cream-50 rounded-2xl border border-charcoal-200 shadow-xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 p-6 md:border-r border-charcoal-200 border-dashed flex flex-col items-center bg-white">
              <div className="w-32 h-32 rounded-full bg-charcoal-200 flex items-center justify-center text-5xl text-charcoal-500 mb-4">
                👤
              </div>
              <h1 className="text-xl font-bold text-charcoal-900 text-center">
                {displayName}
              </h1>
              <p className="text-sm text-charcoal-600 mt-1">
                Age {matchMember.age}
              </p>
            </div>

            <div className="md:w-2/3 p-6 space-y-6">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal-500 mb-3">
                  Match stats
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Total",
                      value: member.matchStats.totalMatches,
                    },
                    { label: "Accepted", value: member.matchStats.accepted },
                    { label: "Denied", value: member.matchStats.denied },
                    { label: "Pending", value: member.matchStats.pending },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-white rounded-lg p-3 border border-charcoal-100 text-center"
                    >
                      <p className="text-2xl font-bold text-charcoal-900">
                        {s.value}
                      </p>
                      <p className="text-xs text-charcoal-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {member.pastMatches.length > 0 && (
                <div className="border-t border-charcoal-200 pt-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal-500 mb-3">
                    Past matches
                  </h2>
                  <ul className="space-y-2">
                    {member.pastMatches.map((pm) => (
                      <li
                        key={pm.matchPublicId}
                        className="text-sm flex justify-between gap-4 border-b border-charcoal-100 pb-2 last:border-0"
                      >
                        <span className="font-medium text-charcoal-800">
                          {pm.otherUserName}
                        </span>
                        <span className="text-charcoal-600">
                          {pm.accepted === true
                            ? "Accepted"
                            : pm.accepted === false
                              ? "Denied"
                              : "Pending"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 pt-0 md:px-6 md:pb-6">
            {notice && (
              <p className="text-sm text-secondary-700 bg-secondary-100 border border-secondary-200 rounded-lg px-3 py-2 mb-4">
                {notice}
              </p>
            )}
            <button
              type="button"
              onClick={handleAddToMatch}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-cream-50"
            >
              Add to match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
