import { useState } from "react";
import { submitEventInterest } from "../../services/api";

interface EventInterestFormProps {
  eventId: number;
  mode?: "gathering" | "registration";
}

export function EventInterestForm({ eventId, mode = "gathering" }: EventInterestFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [openToRomance, setOpenToRomance] = useState<boolean | null>(null);
  const [aboutMe, setAboutMe] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegistration = mode === "registration";

  const canSubmit =
    email.trim() !== "" &&
    openToRomance !== null &&
    aboutMe.trim() !== "" &&
    (!isRegistration || name.trim() !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      await submitEventInterest(eventId, {
        name: name.trim() || undefined,
        email: email.trim(),
        openToRomance: openToRomance!,
        aboutMe: aboutMe.trim(),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl bg-green-50 border border-green-200 p-8 text-center">
        <p className="text-green-800 font-bold text-lg mb-2">
          {isRegistration ? "You're signed up!" : "Thanks for your interest!"}
        </p>
        <p className="text-green-700 text-sm">
          {isRegistration
            ? "We'll send event details to your email."
            : "We'll reach out when this event is scheduled."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="interest-name"
          className="block text-sm font-semibold text-charcoal-900 mb-1.5"
        >
          Name{!isRegistration && <span className="font-normal text-charcoal-400 ml-1">(optional)</span>}
        </label>
        <input
          id="interest-name"
          type="text"
          required={isRegistration}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={255}
          placeholder="Your name"
          className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-2.5 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent1-500 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="interest-email"
          className="block text-sm font-semibold text-charcoal-900 mb-1.5"
        >
          Email
        </label>
        <input
          id="interest-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-2.5 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent1-500 focus:border-transparent"
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-semibold text-charcoal-900 mb-2">
          Are you open to romantic connections?
        </legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="openToRomance"
              checked={openToRomance === true}
              onChange={() => setOpenToRomance(true)}
              className="w-4 h-4 accent-accent1-500"
            />
            <span className="text-sm text-charcoal-700">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="openToRomance"
              checked={openToRomance === false}
              onChange={() => setOpenToRomance(false)}
              className="w-4 h-4 accent-accent1-500"
            />
            <span className="text-sm text-charcoal-700">No</span>
          </label>
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="interest-about"
          className="block text-sm font-semibold text-charcoal-900 mb-1.5"
        >
          Tell us a bit about yourself and what you're looking for
        </label>
        <p className="text-xs text-charcoal-400 mb-2">
          Gender/sexuality, friendship, community, or anything else you'd like
          us to know.
        </p>
        <textarea
          id="interest-about"
          required
          value={aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="e.g. I'm a 28-year-old queer woman looking for new friendships and maybe romance..."
          className="w-full rounded-xl border border-charcoal-200 bg-white px-4 py-2.5 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-accent1-500 focus:border-transparent resize-y"
        />
      </div>

      {error && (
        <div className="bg-primary-50 border border-primary-200 text-primary-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className="w-full bg-accent1-500 hover:bg-accent1-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent1-500/25"
      >
        {submitting
          ? "Submitting..."
          : isRegistration
          ? "Sign Up"
          : "I'm Interested"}
      </button>
    </form>
  );
}
