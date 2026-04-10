import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMembers, type MemberDto } from "../../services/api";
import { useMatchFlow } from "../../contexts/MatchFlowContext";
import { toMatchMember, type MatchMember } from "../../types/matching";
import { getAvatarUrl } from "../../utils/avatar";

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
    <div className="flex-1 min-w-[140px] rounded-xl border-2 border-dashed border-charcoal-200 bg-white p-4 flex flex-col items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-charcoal-400">
        {label}
      </span>
      {member ? (
        <>
          <img
            src={getAvatarUrl(member.id)}
            alt={member.name}
            className="w-16 h-16 rounded-full object-cover"
          />
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
        <>
          <div className="w-16 h-16 rounded-full bg-charcoal-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-charcoal-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
            </svg>
          </div>
          <p className="text-sm text-charcoal-400 text-center">Empty</p>
        </>
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-charcoal-900">
          Match
        </h1>
        <p className="text-charcoal-500 text-sm mt-1">
          Pick two people from the table, then review and send.
        </p>
      </div>

      <section className="flex flex-col sm:flex-row gap-4 items-stretch justify-center">
        <SlotCard
          label="Match slot 1"
          member={slot0}
          onRemove={() => removeFromSlot(0)}
        />
        <div className="hidden sm:flex items-center text-charcoal-300 text-xl font-light">
          +
        </div>
        <SlotCard
          label="Match slot 2"
          member={slot1}
          onRemove={() => removeFromSlot(1)}
        />
      </section>

      <section className="rounded-2xl border border-charcoal-200 bg-white shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary-500 via-accent1-500 to-primary-500" />
        <div className="px-4 py-3 border-b border-charcoal-100">
          <h2 className="text-lg font-semibold text-charcoal-900">
            Members
          </h2>
          <p className="text-sm text-charcoal-500">
            Click a row to open detail and add to a match slot.
          </p>
        </div>

        {loading && (
          <div className="p-8 text-center text-charcoal-400">
            Loading members...
          </div>
        )}

        {error && (
          <div className="p-8 text-center text-primary-600">{error}</div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-charcoal-900">
              <thead>
                <tr className="bg-cream-100 border-b border-charcoal-100">
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">
                    Name
                  </th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">
                    Age
                  </th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">
                    Total matches
                  </th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">
                    Accepted
                  </th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">
                    Denied
                  </th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">
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
                    className="border-b border-charcoal-100 hover:bg-accent2-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl(m.id)}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{m.age}</td>
                    <td className="px-4 py-3.5">
                      {m.matchStats.totalMatches}
                    </td>
                    <td className="px-4 py-3.5">{m.matchStats.accepted}</td>
                    <td className="px-4 py-3.5">{m.matchStats.denied}</td>
                    <td className="px-4 py-3.5">{m.matchStats.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
