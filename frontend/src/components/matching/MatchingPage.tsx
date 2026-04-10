import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMembers, type MemberDto } from "../../services/api";
import { useMatchFlow } from "../../contexts/MatchFlowContext";
import { toMatchMember, type MatchMember } from "../../types/matching";

function SlotCard({
  label,
  member,
  onRemove,
}: {
  label: string;
  member: MatchMember | null;
  onRemove: () => void;
}) {
  return (
    <div className="flex-1 min-w-[140px] rounded-xl border-2 border-dashed border-charcoal-300 bg-white/80 p-4 flex flex-col items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-charcoal-500">
        {label}
      </span>
      <div className="w-16 h-16 rounded-full bg-charcoal-200 flex items-center justify-center text-charcoal-500 text-2xl">
        {member ? "✓" : "👤"}
      </div>
      {member ? (
        <>
          <p className="font-semibold text-charcoal-900 text-center text-sm">
            {member.name}
          </p>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-primary-600 hover:text-primary-700 underline"
          >
            Remove
          </button>
        </>
      ) : (
        <p className="text-sm text-charcoal-500 text-center">Empty</p>
      )}
    </div>
  );
}

export function MatchingPage() {
  const navigate = useNavigate();
  const { slot0, slot1, removeFromSlot } = useMatchFlow();
  const [members, setMembers] = useState<MatchMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMembers()
      .then((data: MemberDto[]) => {
        if (!cancelled) setMembers(data.map(toMatchMember));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 text-cream-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-cream-50">
              Match
            </h1>
            <p className="text-charcoal-300 text-sm mt-1">
              Pick two people from the table, then review and send.
            </p>
          </div>
        </header>

        <section className="flex flex-col sm:flex-row gap-4 items-stretch justify-center">
          <SlotCard
            label="Match slot 1"
            member={slot0}
            onRemove={() => removeFromSlot(0)}
          />
          <div className="hidden sm:flex items-center text-charcoal-500 text-xl font-light">
            +
          </div>
          <SlotCard
            label="Match slot 2"
            member={slot1}
            onRemove={() => removeFromSlot(1)}
          />
        </section>

        <section className="bg-cream-50 rounded-2xl border border-charcoal-200 shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-charcoal-200 bg-white">
            <h2 className="text-lg font-semibold text-charcoal-900">
              Members
            </h2>
            <p className="text-sm text-charcoal-600">
              Click a row to open detail and add to a match slot.
            </p>
          </div>

          {loading && (
            <div className="p-8 text-center text-charcoal-500">
              Loading members...
            </div>
          )}

          {error && (
            <div className="p-8 text-center text-red-600">{error}</div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-charcoal-900">
                <thead>
                  <tr className="bg-charcoal-100 border-b border-charcoal-200">
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">
                      Age
                    </th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">
                      Total matches
                    </th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">
                      Accepted
                    </th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">
                      Denied
                    </th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">
                      Pending
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr
                      key={m.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/match/member/${m.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/match/member/${m.id}`);
                        }
                      }}
                      className="border-b border-charcoal-100 hover:bg-primary-50 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium">{m.name}</div>
                      </td>
                      <td className="px-3 py-3">{m.age}</td>
                      <td className="px-3 py-3">
                        {m.matchStats.totalMatches}
                      </td>
                      <td className="px-3 py-3">{m.matchStats.accepted}</td>
                      <td className="px-3 py-3">{m.matchStats.denied}</td>
                      <td className="px-3 py-3">{m.matchStats.pending}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
