import { useRef, useState } from "react";
import { subscribeToNewsletter } from "../services/api";

export function NewsletterSignup() {
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
      await subscribeToNewsletter(email);
      setSubmitted(true);
      setEmail("");
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border-2 border-accent1-500 bg-accent1-50 p-6">
        <p className="text-charcoal-900 font-bold">You're on the list!</p>
        <p className="text-charcoal-500 text-sm mt-1">
          We'll be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <>
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
          className="bg-accent1-500 hover:bg-accent1-600 text-charcoal-950 font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap disabled:opacity-60"
        >
          {submitting ? "Signing up…" : "Sign me up!"}
        </button>
      </form>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </>
  );
}
