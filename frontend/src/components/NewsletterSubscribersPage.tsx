import { useEffect, useState } from "react";
import {
  getNewsletterSubscribers,
  type NewsletterSubscriberDto,
} from "../services/api";

function CopyButton({
  label,
  count,
  isCopied,
  onClick,
  variant = "solid",
}: {
  label: string;
  count: number;
  isCopied: boolean;
  onClick: () => void;
  variant?: "solid" | "outline";
}) {
  const base =
    variant === "solid"
      ? "bg-primary-500 hover:bg-primary-600 text-white"
      : "bg-white border border-charcoal-200 text-charcoal-700 hover:bg-charcoal-50";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} font-semibold py-2 px-3 rounded-lg text-sm transition-colors flex items-center gap-1.5`}
    >
      {isCopied ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label} ({count})
        </>
      )}
    </button>
  );
}

type CopiedKey = "all" | "newsletter" | "matchmaking" | null;

export function NewsletterSubscribersPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<CopiedKey>(null);

  useEffect(() => {
    getNewsletterSubscribers()
      .then(setSubscribers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const newsletterOnly = subscribers.filter((s) => s.source !== "matchmaking");
  const matchmakingOnly = subscribers.filter((s) => s.source === "matchmaking");

  const handleCopy = async (key: CopiedKey, list: NewsletterSubscriberDto[]) => {
    const emails = list.map((s) => s.email).join("\n");
    await navigator.clipboard.writeText(emails);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-charcoal-900">
            Newsletter Subscribers
          </h1>
          {!loading && !error && (
            <p className="text-sm text-charcoal-400 mt-1">
              {subscribers.length} subscriber{subscribers.length !== 1 && "s"}
            </p>
          )}
        </div>
        {subscribers.length > 0 && (
          <div className="flex gap-2 flex-wrap justify-end">
            <CopyButton
              label="Copy all"
              count={subscribers.length}
              isCopied={copied === "all"}
              onClick={() => handleCopy("all", subscribers)}
            />
            {newsletterOnly.length > 0 && (
              <CopyButton
                label="Newsletter only"
                count={newsletterOnly.length}
                isCopied={copied === "newsletter"}
                onClick={() => handleCopy("newsletter", newsletterOnly)}
                variant="outline"
              />
            )}
            {matchmakingOnly.length > 0 && (
              <CopyButton
                label="Matchmaking only"
                count={matchmakingOnly.length}
                isCopied={copied === "matchmaking"}
                onClick={() => handleCopy("matchmaking", matchmakingOnly)}
                variant="outline"
              />
            )}
          </div>
        )}
      </header>

      {error && (
        <div className="bg-primary-50 border border-primary-200 text-primary-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-charcoal-400 text-center py-12">Loading...</div>
      ) : subscribers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-charcoal-200 bg-white p-12 text-center">
          <p className="text-charcoal-400 text-[15px]">No subscribers yet</p>
          <p className="text-charcoal-300 text-sm mt-1">
            When someone signs up via the landing page, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-charcoal-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-charcoal-100 bg-charcoal-50/50">
                <th className="text-left font-semibold text-charcoal-600 px-5 py-3">
                  Email
                </th>
                <th className="text-left font-semibold text-charcoal-600 px-5 py-3">
                  Source
                </th>
                <th className="text-left font-semibold text-charcoal-600 px-5 py-3">
                  Subscribed
                </th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-charcoal-100 last:border-b-0 hover:bg-cream-50/50 transition-colors"
                >
                  <td className="px-5 py-3 text-charcoal-900">{sub.email}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${sub.source === "matchmaking" ? "bg-accent2-100 text-accent2-700" : "bg-accent1-100 text-accent1-700"}`}>
                      {sub.source ?? "newsletter"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-charcoal-500">
                    {new Date(sub.subscribedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
