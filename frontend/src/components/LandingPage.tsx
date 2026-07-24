import { useEffect, useRef, useState } from "react";
import { subscribeToNewsletter } from "../services/api";

const HERO_IMAGES = [
  "/images/hero/premium_photo-1696972235468-3bfa7fa8bd9e.jpg",
  "/images/hero/premium_photo-1762541155847-1a9759cb06b6.jpg",
  "/images/hero/premium_photo-1762644219831-f779400dc779 (1).jpg",
  "/images/hero/premium_photo-1697565995290-2b6f5dca294f.jpg",
  "/images/hero/premium_photo-1762541086016-11302dd8a73a.jpg",
];

const CYCLE_MS = 6000;

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function LandingPage() {
  const [current, setCurrent] = useState(0);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrent((i) => (i + 1) % HERO_IMAGES.length),
      CYCLE_MS
    );
    return () => clearInterval(timer);
  }, []);

  async function handleNewsletterSubmit(e: React.FormEvent) {
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

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      {/* ── Hero ── */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out"
            style={{
              backgroundImage: `url('${src}')`,
              opacity: i === current ? 1 : 0,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-charcoal-950/70" />

        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          <img
            src="/images/logos/DSC_Primary_Cream.png"
            alt="Domino Social Club"
            className="h-56 md:h-80 mx-auto mb-8"
          />
          <p className="text-cream-100 text-base md:text-lg leading-relaxed max-w-lg mx-auto mb-12">
            Real connections, curated with care. We learn who you are, then
            hand-pick someone worth meeting.
          </p>

          {/* Nav buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => scrollTo("about")}
              className="bg-white/10 hover:bg-white/20 backdrop-blur text-cream-50 font-semibold py-3 px-8 rounded-lg transition-colors border border-cream-50/25 text-sm tracking-wide uppercase"
            >
              About
            </button>
            <button
              onClick={() => scrollTo("join")}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl text-sm tracking-wide uppercase"
            >
              Join the Club
            </button>
            <button
              onClick={() => scrollTo("contact")}
              className="bg-white/10 hover:bg-white/20 backdrop-blur text-cream-50 font-semibold py-3 px-8 rounded-lg transition-colors border border-cream-50/25 text-sm tracking-wide uppercase"
            >
              Contact Us
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <svg
            className="w-6 h-6 text-cream-50/50 animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-1.5 bg-gradient-to-r from-primary-500 via-accent1-500 to-primary-500" />

      {/* ── About ── */}
      <section id="about" className="bg-cream-50 py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-primary-500 font-bold text-xs tracking-[0.25em] uppercase text-center mb-3">
            Who we are
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-900 text-center mb-16">
            About
          </h2>

          <div className="flex flex-col md:flex-row gap-12 md:gap-16 items-center">
            {/* Image */}
            <div className="w-full md:w-5/12 flex-shrink-0">
              <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/5]">
                <img
                  src={HERO_IMAGES[1]}
                  alt="People connecting"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/30 to-transparent" />
              </div>
            </div>

            {/* Three pillars */}
            <div className="flex-1 space-y-10">
              {[
                {
                  label: "Mission",
                  text: "We believe the best connections start with intention, not algorithms. Domino Social Club pairs real people through thoughtful, human matchmaking — one meaningful introduction at a time.",
                },
                {
                  label: "Events",
                  text: "From wine nights to coffee walks, our curated events give you a relaxed way to meet new people in person — no pressure, just good company.",
                },
                {
                  label: "Matchmaking",
                  text: "Our team reads every profile and hand-picks someone we genuinely think you'll connect with, along with a personal note on why we think you'd hit it off.",
                },
              ].map((item) => (
                <div key={item.label}>
                  <h3 className="text-lg font-bold text-charcoal-900 mb-2 flex items-center gap-3">
                    <span className="w-8 h-0.5 bg-primary-400 inline-block rounded" />
                    {item.label}
                  </h3>
                  <p className="text-charcoal-500 leading-relaxed pl-11">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-1.5 bg-gradient-to-r from-primary-500 via-accent1-500 to-primary-500" />

      {/* ── Join the Club ── */}
      <section id="join" className="bg-white py-20 md:py-28 px-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-primary-500 font-bold text-xs tracking-[0.25em] uppercase mb-3">
            Get started
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal-900 mb-4">
            Join the Club
          </h2>
          <p className="text-charcoal-500 leading-relaxed mb-10">
            Sign up for our newsletter to stay in the loop, or create an account
            to start your matchmaking journey.
          </p>

          {/* Newsletter signup */}
          {submitted ? (
            <div className="rounded-2xl border border-accent1-500/30 bg-accent1-100/50 p-6">
              <p className="text-charcoal-900 font-semibold">You're on the list! 🎉</p>
              <p className="text-charcoal-500 text-sm mt-1">
                We'll be in touch soon.
              </p>
            </div>
          ) : (
            <>
              <form
                ref={formRef}
                onSubmit={handleNewsletterSubmit}
                className="flex flex-col sm:flex-row gap-3 mb-8"
              >
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-charcoal-200 px-4 py-3.5 text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-cream-50 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3.5 px-8 rounded-lg transition-colors shadow-md hover:shadow-lg whitespace-nowrap disabled:opacity-60"
                >
                  {submitting ? "Signing up…" : "Newsletter Sign Up"}
                </button>
              </form>
              {error && (
                <p className="text-red-600 text-sm -mt-5 mb-4">{error}</p>
              )}
            </>
          )}

        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-1.5 bg-gradient-to-r from-primary-500 via-accent1-500 to-primary-500" />

      {/* ── Contact Us / Footer ── */}
      <footer id="contact" className="bg-charcoal-950 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-cream-50 mb-8">
            Contact Us
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12">
            <a
              href="https://instagram.com/dominosocialclub"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-charcoal-300 hover:text-cream-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <span>@dominosocialclub</span>
            </a>

            <a
              href="mailto:hello@dominosocialclub.com"
              className="flex items-center gap-2 text-charcoal-300 hover:text-cream-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span>hello@dominosocialclub.com</span>
            </a>
          </div>

          <div className="border-t border-charcoal-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <img
              src="/images/logos/DSC_Secondary_Cream.png"
              alt="Domino Social Club"
              className="h-6"
            />
            <p className="text-charcoal-400 text-sm">
              &copy; {new Date().getFullYear()} Domino Social Club. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
