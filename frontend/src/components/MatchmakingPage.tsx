import { useRef, useState } from "react";
import { subscribeToNewsletter } from "../services/api";

const sections = [
  {
    title: "Learning About You",
    avatar: "/images/avatars/Smiley1_Charcoal.png",
    avatarAlt: "Happy smiley face",
    paragraphs: [
      "If you opt into matchmaking, we'll find a time to get to know you (could be at one of our events or perhaps elsewhere).",
      "We need to know you to match you!",
    ],
  },
  {
    title: "Finding Your Match",
    avatar: "/images/avatars/Smiley4_Charcoal.png",
    avatarAlt: "Winking smiley face",
    paragraphs: [
      "Once we've gotten to know you, we'll keep an eye out in the Domino sphere for someone we think you'd genuinely connect with.",
    ],
  },
  {
    title: "An Intro",
    avatar: "/images/avatars/Smiley5_Charcoal.png",
    avatarAlt: "Heart eyes smiley face",
    paragraphs: [
      "When we see a promising match, we'll reach out to both of you to make the introduction.",
      "You only pay for the service when both people think the match is a good one and want to connect, and right now the cost is low, like $10.",
    ],
  },
  {
    title: "Your First Hang",
    avatar: "/images/avatars/Smiley7_Charcoal.png",
    avatarAlt: "Cool smiley face with cowboy hat",
    paragraphs: [
      "After you both say yes, we'll suggest a few date/hangout ideas based on your shared interests. We know a lot of great activities to do around town to break the ice.",
      "From there, it's all you! Go have fun!",
    ],
  },
];

export function MatchmakingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await subscribeToNewsletter(email, "matchmaking");
      setSubmitted(true);
      setEmail("");
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-cream-50 tracking-wide uppercase">
          Matchmaking
        </h1>
        <p className="text-cream-100 text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
          Sometimes the right introduction just needs a little help. At Domino,
          we take the time to get to know our members and make thoughtful
          introductions for both friendship and romance.
        </p>
      </div>

      {/* Outer card */}
      <section className="bg-cream-50 border-4 border-accent1-500 rounded-3xl p-6 md:p-10">
        {/* Intro paragraph */}
        <div className="mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-accent1-500 mb-4">
            How It Works
          </h2>
          <p className="text-charcoal-700 leading-relaxed">
            Matchmaking can sound a bit intimidating, right? Don't let it be! Picture us as
            your persistent friend who thinks they know someone you'd really
            like. 
          </p>
        </div>

        {/* Process sections */}
        <div className="space-y-5 md:space-y-6 mx-6 md:mx-16">
          {sections.map((section) => (
            <div
              key={section.title}
              className="flex flex-col items-center md:flex-row md:items-center gap-3 md:gap-5"
            >
              <img
                src={section.avatar}
                alt={section.avatarAlt}
                className="w-16 md:w-24 flex-shrink-0"
              />
              <div className="flex-1 min-w-0 bg-accent2-50 border-4 border-accent1-500 rounded-2xl p-5 md:p-6">
                <h3 className="text-xl md:text-2xl font-bold text-accent1-500 mb-3">
                  {section.title}
                </h3>
                <div className="space-y-3 text-charcoal-700 leading-relaxed">
                  {section.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Matchmaking interest CTA */}
        <div className="mt-10 md:mt-12 text-center">
          <h3 className="text-xl md:text-2xl font-bold text-accent1-500 mb-2">
            Interested?
          </h3>
          <p className="text-charcoal-700 leading-relaxed max-w-lg mx-auto mb-6">
            We're still putting the final touches on our Matchmaking process, but drop your email below and we'll reach out when we're ready!
          </p>

          {submitted ? (
            <div className="rounded-2xl border-2 border-accent1-500 bg-accent1-50 p-6 max-w-md mx-auto">
              <p className="text-charcoal-900 font-bold">You're on the list!</p>
              <p className="text-charcoal-500 text-sm mt-1">
                We'll be in touch soon.
              </p>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="flex-1 rounded-xl border-2 border-charcoal-200 bg-white px-4 py-3 text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent1-500 focus:border-accent1-500 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-accent1-500 hover:bg-accent1-600 text-white font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "I'm in!"}
                </button>
              </form>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
