import { Link, Navigate, useNavigate } from "react-router-dom";
import { useMatchFlow } from "../../contexts/MatchFlowContext";
import type { MatchMember } from "../../types/matching";

const compareRows: { key: keyof MatchMember; label: string }[] = [
  { key: "city", label: "City" },
  { key: "age", label: "Age" },
  { key: "orientation", label: "Orientation" },
  { key: "sex", label: "Sex" },
  { key: "dateScore", label: "Date score" },
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
  const { slot0, slot1, resetPair } = useMatchFlow();

  if (!slot0 || !slot1) {
    return <Navigate to="/match" replace />;
  }

  const handleSend = () => {
    // Wire to API later
    resetPair();
    navigate("/match");
  };

  const handleDraft = () => {
    // Wire to API later
    resetPair();
    navigate("/match");
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
                {m.intakeFull.map((row) => (
                  <div
                    key={row.question}
                    className="text-sm border-b border-charcoal-100 pb-3 last:border-0"
                  >
                    <p className="text-xs font-semibold uppercase text-charcoal-500">
                      {row.question}
                    </p>
                    <p className="text-charcoal-800 mt-1">{row.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <section className="bg-cream-50 rounded-2xl border border-charcoal-200 p-4 md:p-6 shadow-lg">
          <h3 className="text-sm font-semibold uppercase text-charcoal-500 mb-4">
            Side-by-side
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-charcoal-900">
              <thead>
                <tr className="border-b border-charcoal-200">
                  <th className="text-left py-2 pr-4 font-medium text-charcoal-600">
                    Field
                  </th>
                  <th className="text-left py-2 pr-4 font-semibold">
                    {slot0.name}
                  </th>
                  <th className="text-left py-2 font-semibold">{slot1.name}</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.key} className="border-b border-charcoal-100">
                    <td className="py-2 pr-4 text-charcoal-600">{row.label}</td>
                    <td className="py-2 pr-4">
                      {formatCell(slot0, row.key)}
                    </td>
                    <td className="py-2">{formatCell(slot1, row.key)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <button
            type="button"
            onClick={handleSend}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Send?
          </button>
          <button
            type="button"
            onClick={handleDraft}
            className="flex-1 bg-white border-2 border-charcoal-300 text-charcoal-900 font-semibold py-3 px-4 rounded-lg hover:bg-charcoal-50 transition-colors"
          >
            Draft?
          </button>
        </div>
      </div>
    </div>
  );
}
